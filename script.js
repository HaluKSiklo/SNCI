// =============== SNCI Core ===============
class SNCI {
    constructor(dim=3, canvasWidth=800, canvasHeight=600){
        this.dim = dim;
        this.internal = Array.from({length: dim}, ()=>Math.random()*2-1);
        this.ruleWeight = Math.random()*1 + 0.5;
        this.forgetRate = Math.random()*0.03 + 0.01;
        this.pos = {x: Math.random()*canvasWidth, y: Math.random()*canvasHeight};
        this.vel = {x: 0, y: 0};
    }

    perceive(stimulus, others){
        let combined = stimulus.slice();
        for(let other of others){
            for(let i=0;i<this.dim;i++) combined[i] += other.internal[i];
        }
        for(let i=0;i<this.dim;i++) combined[i] += (Math.random()*0.6-0.3);
        return combined;
    }

    decideAction(perceived){
        return perceived.map(v => Math.tanh(v*this.ruleWeight) + (Math.random()*0.5-0.25));
    }

    updateInternal(perceived){
        for(let i=0;i<this.dim;i++){
            this.internal[i] += Math.tanh(this.internal[i]*this.ruleWeight) + 0.05*Math.random() + perceived[i]*0.1;
        }
    }

    perturbRules(){
        this.ruleWeight += (Math.random()*0.1-0.05);
        this.forgetRate = Math.abs(this.forgetRate + (Math.random()*0.01-0.005));
    }

    forget(){
        for(let i=0;i<this.dim;i++){
            this.internal[i] *= (1-this.forgetRate);
        }
    }

    step(stimulus, others){
        let perceived = this.perceive(stimulus, others);
        let action = this.decideAction(perceived);
        this.updateInternal(perceived);
        this.perturbRules();
        this.forget();
        return action;
    }

    computeMindText(prevInternal){
        if(!prevInternal) return "考えています...";
        let diffs = this.internal.map((v,i)=>Math.abs(v - prevInternal[i]));
        let avgDiff = diffs.reduce((a,b)=>a+b,0)/diffs.length;
        if(avgDiff<0.05) return "落ち着いています。";
        else if(avgDiff<0.2) return "迷っています。";
        else return "混乱しています！";
    }
}

// =============== World ===============
class World {
    constructor(dim=3, canvasWidth=800, canvasHeight=600){
        this.dim = dim;
        this.state = Array.from({length:dim}, ()=>Math.random()*2-1);
        this.width = canvasWidth;
        this.height = canvasHeight;
    }

    step(actions, humanInput){
        this.state[0] += humanInput*0.1;
        for(let i=0;i<this.dim;i++){
            this.state[i] += actions.reduce((sum,a)=>sum+a[i],0)*0.01 + (Math.random()*0.2-0.1);
        }
        return this.state;
    }

    observe(){ return this.state.slice(); }
}

// =============== Setup ===============
const canvas = document.getElementById("snciCanvas");
const ctx = canvas.getContext("2d");
const humanInputElem = document.getElementById("humanInput");
const mindTextDiv = document.getElementById("mindText");
const resetBtn = document.getElementById("resetBtn");

const numAgents = 5;
const agents = Array.from({length:numAgents}, ()=>new SNCI(3, canvas.width, canvas.height));
const world = new World(3, canvas.width, canvas.height);

let prevInternalStates = agents.map(a=>[...a.internal]);

resetBtn.onclick = ()=>{ 
    for(let a of agents){
        a.internal = Array.from({length: a.dim}, ()=>Math.random()*2-1);
        a.pos = {x: Math.random()*canvas.width, y: Math.random()*canvas.height};
        a.vel = {x:0, y:0};
    }
}

// =============== Camera input (grayscale average) ===============
let camInput = 0;
navigator.mediaDevices.getUserMedia({video:true}).then(stream=>{
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    const camCanvas = document.createElement('canvas');
    const camCtx = camCanvas.getContext('2d');

    function updateCamera(){
        camCtx.drawImage(video,0,0,camCanvas.width=100, camCanvas.height=75);
        const data = camCtx.getImageData(0,0,100,75).data;
        let avg = 0;
        for(let i=0;i<data.length;i+=4) avg += data[i];
        avg /= (data.length/4);
        camInput = (avg/255 - 0.5)*0.5;
        requestAnimationFrame(updateCamera);
    }
    updateCamera();
});

// =============== Animation Loop ===============
function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const stim = world.observe();
    const actions = agents.map((agent,i)=>{
        const others = agents.filter((_,j)=>j!==i);
        return agent.step(stim, others);
    });

    // Update positions (simple physics)
    agents.forEach((agent,i)=>{
        agent.vel.x += (Math.random()-0.5)*0.5 + actions[i][0]*0.5;
        agent.vel.y += (Math.random()-0.5)*0.5 + actions[i][1]*0.5;
        agent.pos.x += agent.vel.x;
        agent.pos.y += agent.vel.y;

        // Bounce edges
        if(agent.pos.x<0 || agent.pos.x>canvas.width) agent.vel.x*=-0.8;
        if(agent.pos.y<0 || agent.pos.y>canvas.height) agent.vel.y*=-0.8;

        // Dampen velocity
        agent.vel.x *= 0.95;
        agent.vel.y *= 0.95;

        // Draw circle
        const colorVal = Math.floor((agent.internal[2]+1)*128);
        ctx.fillStyle = `rgb(${colorVal},${50},${255-colorVal})`;
        const radius = 10 + Math.abs(agent.internal[0])*5;
        ctx.beginPath();
        ctx.arc(agent.pos.x, agent.pos.y, radius, 0, Math.PI*2);
        ctx.fill();
    });

    // Update world
    world.step(actions, parseFloat(humanInputElem.value) + camInput);

    // Update mindText
    mindTextDiv.innerHTML = agents.map((agent,i)=>`Agent ${i}: ${agent.computeMindText(prevInternalStates[i])}`).join('<br>');
    prevInternalStates = agents.map(a=>[...a.internal]);

    requestAnimationFrame(animate);
}

animate();
