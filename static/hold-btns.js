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
    
        let countdownElement = btn.querySelector(".countdown");
   
        let btnHoldStart;
        let isCanceled = false;
    
        btn.ontouchstart = async (e) => {
            e.preventDefault();
    
            isCanceled = false;
            btnHoldStart = new Date().getTime();
    
            for (let i = holdFor; i > 0; i--) {
                if (isCanceled) {
                    break;
                }
                countdownElement.innerText = i;
                await sleep(1000);
            }
    
            countdownElement.innerText = "";
    
            if (!isCanceled) {
                btn.dispatchEvent(new Event("click"));
            }
            
            isCanceled = true;
    
            // while (
            //     new Date().getTime() - btnHoldStart < holdFor
            //     && !isCanceled
            // ) {
            //     setTimeout(() => {
            //         let tMinus = Math.ceil((holdFor - (new Date().getTime() - btnHoldStart)) / 1000);
            //         countdownElement.innerHTML = tMinus;
            //     });
            // }
        }
    
        btn.ontouchend = (e) => {
            e.preventDefault();
            isCanceled = true;
            countdownElement.innerText = ""; 
        }
    });
});
