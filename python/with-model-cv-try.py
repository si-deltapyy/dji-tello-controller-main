#Thread dipisah

import cv2
from djitellopy import Tello
import tensorflow as tf
import numpy as np
import threading
import keyboard


def load_model():
    # Muat model TensorFlow dan konfigurasi pbtxt
    detection_graph = tf.Graph()
    with detection_graph.as_default():
        od_graph_def = tf.compat.v1.GraphDef()
        # Muat frozen_inference_graph.pb
        with tf.io.gfile.GFile("frozen_inference_graph.pb", "rb") as f:
            serialized_graph = f.read()
            od_graph_def.ParseFromString(serialized_graph)
            tf.import_graph_def(od_graph_def, name="")

    sess = tf.compat.v1.Session(graph=detection_graph)
    input_tensor = detection_graph.get_tensor_by_name("image_tensor:0")
    boxes = detection_graph.get_tensor_by_name("detection_boxes:0")
    scores = detection_graph.get_tensor_by_name("detection_scores:0")
    classes = detection_graph.get_tensor_by_name("detection_classes:0")
    num_detections = detection_graph.get_tensor_by_name("num_detections:0")

    return sess, input_tensor, boxes, scores, classes, num_detections


def detect_objects(frame, sess, input_tensor, boxes, scores, classes, num_detections):
    # Resize frame untuk model
    resized_frame = cv2.resize(frame, (300, 300))
    input_frame = np.expand_dims(resized_frame, axis=0)

    # Inferensi menggunakan model
    (det_boxes, det_scores, det_classes, det_num_detections) = sess.run(
        [boxes, scores, classes, num_detections],
        feed_dict={input_tensor: input_frame}
    )

    # Filter berdasarkan skor deteksi
    h, w, _ = frame.shape
    for i in range(int(det_num_detections[0])):
        if det_scores[0][i] > 0.5:  # Ambang batas deteksi
            box = det_boxes[0][i]
            (ymin, xmin, ymax, xmax) = (box[0] * h, box[1] * w, box[2] * h, box[3] * w)
            cv2.rectangle(frame, (int(xmin), int(ymin)), (int(xmax), int(ymax)), (0, 255, 0), 2)

    return frame


def process_video(tello, sess, input_tensor, boxes, scores, classes, num_detections, stop_event):
    while not stop_event.is_set():
        frame = tello.get_frame_read().frame
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Deteksi objek
        frame_rgb = detect_objects(frame_rgb, sess, input_tensor, boxes, scores, classes, num_detections)

        # Tampilkan frame
        cv2.imshow("Tello Video Feed with Object Detection", frame_rgb)

        # Tekan 'q' untuk keluar
        if cv2.waitKey(1) & 0xFF == ord('q'):
            stop_event.set()
            break

    cv2.destroyAllWindows()
    tello.streamoff()


def keyboard_control(tello, stop_event):
    print("Kontrol Drone:")
    print("  - w/s: Naik/Turun")
    print("  - a/d: Miring kiri/kanan")
    print("  - up/down: Maju/Mundur")
    print("  - left/right: Rotasi kiri/kanan")
    print("  - t: Takeoff")
    print("  - l: Landing")
    print("  - q: Keluar")

    while not stop_event.is_set():
        # Takeoff
        if keyboard.is_pressed('t'):
            print("Takeoff")
            tello.takeoff()

        # Landing
        elif keyboard.is_pressed('l'):
            print("Landing")
            tello.land()

        # Naik/Turun
        elif keyboard.is_pressed('w'):
            print("Naik")
            tello.move_up(30)
        elif keyboard.is_pressed('s'):
            print("Turun")
            tello.move_down(30)

        # Miring kiri/kanan
        elif keyboard.is_pressed('a'):
            print("Miring ke kiri")
            tello.move_left(30)
        elif keyboard.is_pressed('d'):
            print("Miring ke kanan")
            tello.move_right(30)

        # Maju/Mundur
        elif keyboard.is_pressed('up'):
            print("Maju")
            tello.move_forward(30)
        elif keyboard.is_pressed('down'):
            print("Mundur")
            tello.move_back(30)

        # Rotasi kiri/kanan
        elif keyboard.is_pressed('left'):
            print("Rotasi ke kiri")
            tello.rotate_counter_clockwise(30)
        elif keyboard.is_pressed('right'):
            print("Rotasi ke kanan")
            tello.rotate_clockwise(30)

        # Keluar
        elif keyboard.is_pressed('q'):
            print("Keluar dari kontrol")
            stop_event.set()
            tello.end()
            break


def run():
    tello = Tello()
    tello.connect()
    print(f"Battery Level: {tello.get_battery()}%")
    tello.streamon()

    # Muat model deteksi
    sess, input_tensor, boxes, scores, classes, num_detections = load_model()

    # Event untuk menghentikan thread
    stop_event = threading.Event()

    # Jalankan video feed di thread terpisah
    video_thread = threading.Thread(
        target=process_video, args=(tello, sess, input_tensor, boxes, scores, classes, num_detections, stop_event)
    )
    video_thread.start()

    # Jalankan kontrol keyboard di thread utama
    keyboard_control(tello, stop_event)

    # Tunggu hingga video thread selesai
    video_thread.join()


if __name__ == "__main__":
    run()
