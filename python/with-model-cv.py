# Belum ada kontrol drone

import cv2
from djitellopy import Tello
import tensorflow as tf
import numpy as np


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

    return sess, detection_graph, input_tensor, boxes, scores, classes, num_detections


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


def process(tello, sess, input_tensor, boxes, scores, classes, num_detections):
    while True:
        frame = tello.get_frame_read().frame
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Deteksi objek
        frame_rgb = detect_objects(frame_rgb, sess, input_tensor, boxes, scores, classes, num_detections)

        # Tampilkan frame
        cv2.imshow("Frame", frame_rgb)

        # Tekan 'q' untuk keluar
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cv2.destroyAllWindows()
    tello.end()


def run():
    tello = Tello()
    tello.connect()
    print(f"Battery Level: {tello.get_battery()}%")
    tello.streamon()

    # Muat model deteksi
    sess, detection_graph, input_tensor, boxes, scores, classes, num_detections = load_model()

    # Proses video
    process(tello, sess, input_tensor, boxes, scores, classes, num_detections)


if __name__ == "__main__":
    run()
