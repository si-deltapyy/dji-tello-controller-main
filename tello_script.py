# tello_script.py
import cv2
from djitellopy import Tello

def process(tello):
    while True:
        frame = tello.get_frame_read().frame
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        cv2.imshow("Frame", frame_rgb)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    cv2.destroyAllWindows()
    tello.end()

def run():
    tello = Tello()
    tello.connect()
    tello.streamon()
    process(tello)

if __name__ == "__main__":
    run()
