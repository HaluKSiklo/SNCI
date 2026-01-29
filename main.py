# main.py
import tkinter as tk
from snci_human import SNCIApp
from snci_visual import visualize_snci

if __name__ == "__main__":
    root = tk.Tk()
    root.title("SNCI Real-Time App")
    app = SNCIApp(root, num_agents=3, dim=3, steps=500)
    root.mainloop()

    # 終了後に可視化
    visualize_snci(app.agents, app.log_world)
