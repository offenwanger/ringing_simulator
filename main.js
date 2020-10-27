
(function () {
    const DEBUG = true
    function log(str) {
        if(DEBUG) console.log(str)
    }

    function ringBell(number) {
        window.dispatchEvent(new KeyboardEvent('keydown',{'key':"" + number}));
        log("pressed "+nextBell)
    
        window.dispatchEvent(new KeyboardEvent('keyup',{'key':"" + number}));
        log("released "+nextBell)
    }

    nextBell = 1
    stand = false;
    
    function ringLoop() {
        if(stand) {
            stand = false;
            return;
        }
    
        ringBell(nextBell);
    
        nextBell = (nextBell % 8) + 1
        setTimeout(function(){ ringLoop() }, 500);
    }
    
    function takeAllBells(e) {
        if(e.key == "l"){
            setTimeout(function(){ ringLoop() }, 2000);
        }
    
        if(e.key == "t"){
            stand = true
        }
    }

    const HAND = true;
    const BACK = false;
    let peelSpeedInHours = 3
    let changeTime = peelSpeedInHours / 5000 /* hours per row */ * 60 /*minutes*/ * 60 /*seconds*/ * 1000 /* miliseconds */
    let bellInterval = -1;
    let gracePeriod = -1
    let numberOfbells = -1
    let currentChange = [1, 5, 2, 6, 3, 7, 4, 8]
    let changeEnd = Date.now();
    let place = 0;
    let stroke = HAND;
    let iAmRinging = []
    function takeRemainingBells(e) {
        iAmRinging = getRemainingBells();
        numberOfbells = getNumberOfBells();
        bellInterval = changeTime / numberOfbells;
        gracePeriod = bellInterval * 2 / 3
        if(e.key == "l"){
            setTimeout(function(){ 
                let changeEnd = Date.now();
                ringNext() 
            }, 2000);
        }
    
        if(e.key == "t"){
            stand = true
            place = 0;
            stroke = HAND;
        }
    }

    function ringNext() {
        let currentBell = currentChange[place];
        // pause for one best after the end of the last change, if it's a handstroke, pause for two beats for handstroke gap. 
        let waitTime = (bellInterval * (place + (stroke == HAND?2:1))) - (Date.now() - changeEnd);
        if(waitTime <= 0) {
            if(iAmRinging.includes(currentBell)) {
                // If it's the simulator, go for it.
                ringBell(currentBell)
            } else {
                // Check if we need to wait
                let state = getState();
                let lastBellHasRung = (stroke == HAND && state[place] != HAND) || (stroke == BACK && state[place] != BACK)
                if(!lastBellHasRung) {
                    if(waitTime + gracePeriod > 0) {
                        // We still have grace period. Hesitate.
                        setTimeout(function(){ ringNext() }, waitTime + gracePeriod / 10);
                        // Prevent moving on
                        return;
                    }
                } // else last bell rang, carry on.
            }

            place++
            if(place >= numberOfbells) {
                if(stand && stroke == BACK) {
                    stand = false;
                    return;
                }

                nextChange()
            }

            // Run the loop again to trigger the appropriate wait.
            ringNext();
        } else {
            setTimeout(function(){ ringNext() }, waitTime);
        }
    }

    function nextChange() {
        if(stroke == HAND) stroke = BACK;
        else stroke = HAND;
        changeEnd = Date.now()
        place = 0;
    }

    function getNumberOfBells() {
        return 8;
    }

    function getRemainingBells() {
        return [1, 3, 6, 7, 8]
    }

    function getState() {
        return [HAND, HAND, HAND, HAND, HAND, HAND, HAND, HAND];
    }

    chrome.runtime.onMessage.addListener(function(request) {
        log(request)
        switch(request.type) {
            case "takeAll": 
                window.addEventListener('keydown', takeAllBells)
                break;
    
            case "dropAll": 
                window.removeEventListener('keydown', takeAllBells)
                break;

            case "takeRemaining":
                window.addEventListener('keydown', takeRemainingBells);
        }
    });
})();