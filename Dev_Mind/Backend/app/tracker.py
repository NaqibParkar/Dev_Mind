import threading
import time
import math
from datetime import datetime
try:
    from pynput import keyboard, mouse
except ImportError:
    keyboard = None
    mouse = None

from . import crud, schemas
from .database import SessionLocal
from .models import Project
import ctypes
from ctypes import wintypes

def get_active_window():
    try:
        hwnd = ctypes.windll.user32.GetForegroundWindow()
        length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
        if length == 0:
            return "Unknown"
        buff = ctypes.create_unicode_buffer(length + 1)
        ctypes.windll.user32.GetWindowTextW(hwnd, buff, length + 1)
        # print(f"DEBUG: Detected Window: {buff.value}") # Uncomment for verbose window debugging
        return buff.value
    except Exception as e:
        return "Unknown"

class ActivityTracker:
    def __init__(self):
        # Monotonic Counters (Never reset unless restart)
        self.total_keystrokes = 0
        self.total_mouse_distance = 0.0

        self.last_x = None 
        self.last_y = None
        
        # Stats for ML/API (Last 5s interval)
        self.last_interval_keystrokes = 0
        self.last_interval_mouse = 0.0
        self.last_interval_context_switches = 0
        
        # Context Switching
        self.context_switches = 0
        self.last_window = None

        self._running = False
        self._lock = threading.Lock()
        
        self.mouse_listener = None
        
        # New: Context Switch Tracking
        self.context_switches = 0
        self.current_window = "Unknown"
        
        # New: Cumulative Stats for Live UI
        self.total_keystrokes = 0
        self.total_mouse_distance = 0.0

    def get_current_stats(self):
        with self._lock:
            current_window = self.current_window
            
            # Detect Context Switch (Already handled in monitor loop, but let's be double sure if needed)
            # For now, we use the values updated by the monitor loop.

            return {
                "keystrokes": self.total_keystrokes,
                "mouse_distance": self.total_mouse_distance,
                "active_window": current_window,
                "last_interval_keystrokes": self.last_interval_keystrokes,
                "last_interval_mouse": self.last_interval_mouse,
                "last_interval_context_switches": self.last_interval_context_switches,
                "context_switches": self.context_switches
            }
        
    def _on_press(self, key):
        with self._lock:
            self.total_keystrokes += 1
            if self.total_keystrokes % 10 == 0:
                print(f"DEBUG: 10 keys pressed. Total: {self.total_keystrokes}")

    def _on_move(self, x, y):
        try:
            with self._lock:
                if self.last_x is not None and self.last_y is not None:
                    dist = math.sqrt((x - self.last_x)**2 + (y - self.last_y)**2)
                    self.total_mouse_distance += dist
                self.last_x = x
                self.last_y = y
        except Exception as e:
            pass

    def start(self):
        if not keyboard or not mouse:
            print("ERROR: Pynput not available. Tracking disabled.")
            return
        
        self._running = True
        try:
            self.keyboard_listener = keyboard.Listener(on_press=self._on_press)
            self.mouse_listener = mouse.Listener(on_move=self._on_move)
            self.keyboard_listener.start()
            self.mouse_listener.start()
            print("DEBUG: Keyboard and Mouse listeners started.")
        except Exception as e:
            print(f"ERROR: Failed to start listeners: {e}")
        
        self.thread = threading.Thread(target=self._logging_loop, daemon=True)
        self.thread.start()
        
        # New: Window Monitor Thread (Fast Poll) from origin/main
        self.monitor_thread = threading.Thread(target=self._monitor_window_loop, daemon=True)
        self.monitor_thread.start()
        
        print("DEBUG: Activity Tracker Background Threads Started")

    def stop(self):
        self._running = False
        if self.keyboard_listener: self.keyboard_listener.stop()
        if self.mouse_listener: self.mouse_listener.stop()

    def _monitor_window_loop(self):
        """Polls active window frequently to catch switches."""
        last_window = "Unknown"
        while self._running:
            time.sleep(0.5) # Check every 500ms
            
            try:
                new_window = get_active_window()
                
                # Update current window securely
                with self._lock:
                    self.current_window = new_window
                    
                # Detect switch (ignore Unknown/Empty)
                if new_window and new_window != "Unknown" and new_window != last_window:
                    if last_window != "Unknown": # Don't count initialization as a switch
                         with self._lock:
                             self.context_switches += 1
                    last_window = new_window
                    
            except Exception as e:
                print(f"Monitor error: {e}")

    def _logging_loop(self):
        last_logged_keys = 0
        last_logged_mouse = 0.0
        last_logged_switches = 0

        while self._running:
            time.sleep(5)
            
            with self._lock:
                current_total_keys = self.total_keystrokes
                current_total_mouse = self.total_mouse_distance
                
                # Calculate Delta for this interval
                delta_keys = current_total_keys - last_logged_keys
                delta_mouse = current_total_mouse - last_logged_mouse
                delta_switches = self.context_switches - last_logged_switches
                
                # Store for ML
                self.last_interval_keystrokes = delta_keys
                self.last_interval_mouse = delta_mouse
                self.last_interval_context_switches = max(0, delta_switches)
                
                # Update last logged checkpoints
                last_logged_keys = current_total_keys
                last_logged_mouse = current_total_mouse
                last_logged_switches = self.context_switches

            # Skip idle writes so the latest DB row remains a meaningful activity snapshot.
            if delta_keys <= 0 and delta_mouse <= 0 and delta_switches <= 0:
                continue
            
            # Log the DELTA to DB
            self._save_to_db(delta_keys, int(delta_mouse))

    def _save_to_db(self, keystrokes, mouse_dist):
        # Ensure project and window are tracked
        db = None
        try:
            db = SessionLocal()
            active_project = db.query(Project).filter(Project.status == "Active").first()
            project_id = active_project.id if active_project else None
            
            with self._lock:
                current_window = self.current_window
            activity = schemas.ActivityData(
                timestamp=datetime.utcnow(),
                keystrokes=keystrokes,
                mouse_distance=mouse_dist,
                active_window=current_window if current_window else "Idle", 
                project_id=project_id,
            )
            crud.log_activity(db, activity)
        except Exception as e:
            print(f"Error logging: {e}")
        finally:
            if db:
                db.close()