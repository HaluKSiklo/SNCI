# snci_visual.py
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

def vector_sum(vec):
    return sum(vec)

def visualize_snci(agents, log_world):
    fig, ax = plt.subplots(figsize=(10,6))

    def update(frame):
        ax.clear()
        for i, agent in enumerate(agents):
            if frame < len(agent.log_internal):
                internal_sums = [vector_sum(x) for x in agent.log_internal[:frame+1]]
                ax.plot(internal_sums, label=f"Agent {i} internal sum")
        if frame < len(log_world):
            world_sums = [vector_sum(x) for x in log_world[:frame+1]]
            ax.plot(world_sums, label="World sum", linewidth=2, color='black')
        ax.legend()
        ax.set_xlabel("time step")
        ax.set_ylabel("sum of vector components")
        ax.set_title("Multi-SNCI Interaction with Human Input")

    anim = FuncAnimation(fig, update, frames=len(log_world), interval=100)
    plt.show()
