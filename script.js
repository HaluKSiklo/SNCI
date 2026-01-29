// script.js

// ================= SNCI Core =================
class MultiSNCI {
    constructor(dim=3) {
        this.dim = dim;
        this.internal = Array.from({length: dim}, ()=>Math.random()*2-1);
        this.ruleWeight = Math.random()*1 + 0.5;
        this.forgetRate = Math.random()*0.04 + 0.01;
        this.logInternal = [];
        this.logAction = [];
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
        return perceived.map(v => Math.tanh(v*this.ruleWeight) + (Math.random()*1-0.5));
    }

    updateInternal(perceived){
        for(let i=0;i<this.dim;i++){
            this.internal[i] += Math.tanh(this.internal[i]*this.ruleWeight) + 0.1*Math.random() + perceived[i];
        }
    }

    perturbRules(){
        this.ruleWeight += (Math.random()*0.1-0.05);
        this.forgetRate = Math.abs(this.forgetRate + (Math.random()*0.02-0.01));
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
        this.logInternal.push([...this.internal]);
        this.logAction.push([...action]);
        return action;
    }

    computeMindText(){
        if(this.logInternal.length<2) return "考えています...";
        let diffs = this.internal.map((v,i)=>Math.abs(v - this.logInternal[this.logInternal.length-2][i]));
        let avgDiff = diffs.reduce((a,b)=>a+b,0)/diffs.length;
        if(avgDiff<0.05) return "少し落ち着いています。";
        else if(avgDiff<0.2) return "迷いがあります。";
        else return "私は混乱しています！";
    }
}

class MultiWorld {
    constructor(dim=3){
        this.dim = dim;
        this.state = Array.from({length:dim}, ()=>Math.random()*2-1);
    }

    step(action, humanInput){
        this.state[0] += humanInput;
        for(let i=0;i<this.dim;i++) this.state[i] += action[i] + (Math.random()*0.4-0.2);
        return this.state;
    }

    observe(){ return this.state.slice(); }
}

// ================= App =================
const numAgents = 3;
const agents = Array.from({length:numAgents}, ()=>new MultiSNCI());
const world = new MultiWorld();
let logWorld = [];
let humanInputElem = document.getElementById("humanInput");
let mindTextDiv = document.getElementById("mindText");

// Chart.js setup
const ctx = document.getElementById('snciChart').getContext('2d');
let chartData = {
    labels: [],
    datasets: agents.map((_,i)=>({
        label:`Agent ${i}`,
        data: [],
        borderColor:`hsl(${i*120},70%,50%)`,
        fill:false
    })).concat([{label:"World", data:[], borderColor:'black', fill:false}])
};

const chart = new Chart(ctx,{
    type:'line',
    data: chartData,
    options:{animation:false, responsive:true}
});

// Camera input
let humanInput = 0;
navigator.mediaDevices.getUserMedia({video:true}).then(stream=>{
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    const canvas = document.createElement('canvas');
    const ctxCam = canvas.getContext('2d');

    function updateCamera(){
        ctxCam.drawImage(video,0,0,canvas.width=100,canvas.height=75);
        let imgData = ctxCam.getImageData(0,0,canvas.width,canvas.height);
        let avg = 0;
        for(let i=0;i<imgData.data.length;i+=4) avg += imgData.data[i];
        avg /= (imgData.data.length/4);
        humanInput += (avg/255-0.5)*0.05;
        requestAnimationFrame(updateCamera);
    }
    updateCamera();
});

// ================= Main Loop =================
let stepCount = 0;
function stepSNCI(){
    const stim = world.observe();
    const actions = agents.map(agent=>{
        const others = agents.filter(a=>a!==agent);
        return agent.step(stim, others);
    });

    const totalAction = Array.from({length:world.dim}, (_,i)=>actions.reduce((sum,a)=>sum+a[i],0));
    const worldState = world.step(totalAction, parseFloat(humanInputElem.value)+humanInput);
    logWorld.push([...worldState]);

    // Update chart
    chart.data.labels.push(stepCount);
    agents.forEach((agent,i)=>chart.data.datasets[i].data.push(agent.internal.reduce((a,b)=>a+b,0)));
    chart.data.datasets[numAgents].data.push(worldState.reduce((a,b)=>a+b,0));
    chart.update();

    // Update mindText
    mindTextDiv.innerHTML = agents.map((a,i)=>`Agent ${i}: ${a.computeMindText()}`).join('<br>');

    stepCount++;
    requestAnimationFrame(stepSNCI);
}

stepSNCI();
