import numpy as np
# Monkey patch for legacy compatibility
np.object = object
np.bool = bool

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import os
# import tensorflowjs as tfjs

# Load Data
data = np.load("training_data.npz")
X = data["X"]
y = data["y"]

# Model Architecture: 1D-CNN
# Input: [Batch, WindowSize(6), Features(8)]
input_shape = (6, 8)

model = keras.Sequential([
    layers.InputLayer(input_shape=input_shape),
    
    # Conv Block 1
    layers.Conv1D(filters=32, kernel_size=3, activation='relu', padding='same'),
    layers.BatchNormalization(),
    layers.Dropout(0.2),
    
    # Conv Block 2
    layers.Conv1D(filters=16, kernel_size=3, activation='relu', padding='same'),
    layers.GlobalAveragePooling1D(),
    
    # Dense Output
    layers.Dense(16, activation='relu'),
    layers.Dense(3, activation='softmax') # 3 Classes: Stable, Declining, Improving
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# Train
history = model.fit(
    X, y,
    epochs=20,
    batch_size=32,
    validation_split=0.2,
    verbose=1
)

# Save Model
model_dir = "../public/models/trend-cnn"
os.makedirs(model_dir, exist_ok=True)

# Export to TFJS
# tfjs.converters.save_keras_model(model, model_dir)
# print(f"Model saved to {model_dir}")

# Save as Keras format as backup
model.save("trend_model.keras")
print("Saved trend_model.keras")
