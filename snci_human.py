# snci_human.py
import tkinter as tk
from threading import Thread
import cv2
import numpy as np
import time
from snci_core import MultiSNCI, MultiWorld, vector_sum

class SNCIApp:
    def __init__(self, master, num_agents=2, dim=3, steps=500):
        self.master = master
        self.num_agents = num_agents
        self.dim = dim
        self.steps = steps

        # 世界とSNCI
        self.world = MultiWorld(dim=dim)
        self.agents = [MultiSNCI(dim=dim) for _ in range(num_agents)]
        self.log_world = []

        # GUI要素
        self.input_label = tk.Label(master, text="Human input:")
        self.input_label.pack()
        self.input_entry = tk.Entry(master)
        self.input_entry.pack()
        self.send_button = tk.Button(master, text="Send", command=self.send_input)
        self.send_button.pack()
        self.text_area = tk.Text(master, height=5, width=50)
        self.text_area.pack()

        self.human_input = 0.0
        self.running = True

        # カメラ初期化
        self.cap = cv2.VideoCapture(0)
        Thread(target=self.update_loop, daemon=True).start()
        Thread(target=self.camera_loop, daemon=True).start()

    def send_input(self):
        try:
            self.human_input = float(self.input_entry.get())
        except:
            self.human_input = 0.0

    def camera_loop(self):
        while self.running:
            ret, frame = self.cap.read()
            if ret:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                avg_brightness = np.mean(gray)
                self.human_input += (avg_brightness / 255.0 - 0.5) * 0.1
            time.sleep(0.05)

    def compute_mind_text(self, agent):
        if len(agent.log_internal) < 2:
            return "考えています..."
        diffs = [abs(a - b) for a,b in zip(agent.log_internal[-1], agent.log_internal[-2])]
        avg_diff = np.mean(diffs)
        if avg_diff < 0.05:
            return "少し落ち着いています。"
        elif avg_diff < 0.2:
            return "迷いがあります。"
        else:
            return "私は混乱しています！"

    def update_loop(self):
        for t in range(self.steps):
            stim = self.world.observe()
            actions = []
            for agent in self.agents:
                others = [a for a in self.agents if a != agent]
                act = agent.step(stim, others)
                actions.append(act)
            total_action = [sum(x) for x in zip(*actions)]
            world_state = self.world.step(total_action, self.human_input)
            self.log_world.append(world_state.copy())

            # 迷い文章更新
            self.text_area.delete(1.0, tk.END)
            for i, agent in enumerate(self.agents):
                mind_text = self.compute_mind_text(agent)
                self.text_area.insert(tk.END, f"Agent {i}: {mind_text}\n")
            time.sleep(0.1)

        self.running = False
        self.cap.release()
