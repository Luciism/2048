function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener("DOMContentLoaded", () => {
    const holdBtns = Array.from(document.querySelectorAll("[hold-for]"));

    holdBtns.forEach(btn => {

        const holdFor = parseInt(btn.getAttribute("hold-for"));
        if (!holdFor > 0) {
            return;  // Invalid number
        }
    
        btn.style["--animation-duration"] = `${holdFor}s`;

        const countdownElement = btn.querySelector(".countdown");
        const contentElement = btn.querySelector(".content");
   
        let isHeld = false;
        let globalTouchID = 0;
    
        btn.ontouchstart = async (e) => {
            e.preventDefault();
            const localTouchID = ++globalTouchID;

            countdownElement.style.display = "block";
            contentElement.style.display = "none";
            
            btn.classList.add("hold-progress-animation");

            isHeld = true;
            btnHoldStart = new Date().getTime();
    
            for (let i = holdFor; i > 0; i--) {
                if (!isHeld || globalTouchID !== localTouchID ) {
                    break;
                }
                console.log(`Countdown for event ${localTouchID} is at ${i}`);
                countdownElement.innerText = i;
                await sleep(1000);
            }
    
            if (isHeld && globalTouchID === localTouchID) {
                countdownElement.innerText = "0";
                btn.dispatchEvent(new Event("click"));
            }
        }
    
        btn.ontouchend = (e) => {
            e.preventDefault();
            isHeld = false;
            countdownElement.style.display = "none";
            contentElement.style.display = "inline";
            btn.classList.remove("hold-progress-animation");
            countdownElement.innerText = ""; 
        }
    });
});
