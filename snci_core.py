# snci_core.py
import random
import math
from dataclasses import dataclass, field
from typing import List

def vector_noise(dim: int, scale: float):
    return [random.uniform(-scale, scale) for _ in range(dim)]

def vector_tanh(vec: List[float]):
    return [math.tanh(v) for v in vec]

def vector_add(a: List[float], b: List[float]):
    return [x + y for x, y in zip(a, b)]

def vector_scale(vec: List[float], scale: float):
    return [x * scale for x in vec]

@dataclass
class MultiWorld:
    dim: int = 3
    state: List[float] = field(default_factory=lambda: vector_noise(3,1.0))

    def step(self, action: List[float], human_input: float = 0.0) -> List[float]:
        # 人間入力を世界の0次元目に反映
        self.state[0] += human_input
        # 行動を加算
        self.state = vector_add(self.state, vector_add(action, vector_noise(len(action),0.2)))
        return self.state

    def observe(self) -> List[float]:
        return self.state.copy()

@dataclass
class MultiSNCI:
    dim: int = 3
    internal: List[float] = field(default_factory=lambda: vector_noise(3,1.0))
    rule_weight: float = field(default_factory=lambda: random.uniform(0.5,1.5))
    forget_rate: float = field(default_factory=lambda: random.uniform(0.01,0.05))
    log_internal: List[List[float]] = field(default_factory=list)
    log_action: List[List[float]] = field(default_factory=list)

    def perceive(self, stimulus: List[float], others: List['MultiSNCI']) -> List[float]:
        stim_sum = [0.0]*self.dim
        for other in others:
            stim_sum = vector_add(stim_sum, other.internal)
        combined = vector_add(stimulus, stim_sum)
        combined = vector_add(combined, vector_noise(self.dim,0.3))
        return combined

    def decide_action(self, perceived: List[float]) -> List[float]:
        tanh_vec = vector_tanh(vector_scale(perceived,self.rule_weight))
        action = vector_add(tanh_vec, vector_noise(self.dim,0.5))
        return action

    def update_internal(self, perceived: List[float]):
        drift = vector_tanh(vector_scale(self.internal,self.rule_weight))
        update = vector_add(vector_scale(drift,1.0), vector_noise(self.dim,0.1))
        self.internal = vector_add(self.internal, vector_add(update, perceived))

    def perturb_rules(self):
        self.rule_weight += random.uniform(-0.05,0.05)
        self.forget_rate = abs(self.forget_rate + random.uniform(-0.01,0.01))

    def forget(self):
        self.internal = vector_scale(self.internal,1.0 - self.forget_rate)

    def step(self, stimulus: List[float], others: List['MultiSNCI']) -> List[float]:
        perceived = self.perceive(stimulus, others)
        action = self.decide_action(perceived)
        self.update_internal(perceived)
        self.perturb_rules()
        self.forget()
        self.log_internal.append(self.internal.copy())
        self.log_action.append(action.copy())
        return action
