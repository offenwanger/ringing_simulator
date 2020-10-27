
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
    let peelSpeedInHours = 4
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
                changeEnd = Date.now();
                ringNext() 
            }, 2000);
        }
    
        if(e.key == "t"){
            stand = true
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
                let lastBellHasRung = (stroke == HAND && state[currentBell] != HAND) || (stroke == BACK && state[currentBell] != BACK)
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
        console.log("stroke changing")
        console.log(stroke)
        if(stroke == HAND) {
            stroke = BACK;
        } else {
            stroke = HAND;
        }
        changeEnd = Date.now()
        place = 0;
    }

    function getNumberOfBells() {
        return $(".bell_img").length;
    }

    function getRemainingBells() {
        let bells = []
        $(".bell").each(function (index, bell) {
            bell = $(bell)
            if(bell.find(".btn-group").children().length == 2) {
                // Bell is assigned to a user
                log("Bell " + bell.attr('id') + " taken.")
            } else if(bell.find(".btn-group").children().length == 1) {
                // Bell is unassigned
                bells.push(parseInt(bell.attr('id')))
            } else {
                console.error("Interface changed and this extention is out of sync or something glitched!")
            }
        })
        return bells;
    }

    function getState() {
        state = []
        $(".bell").each(function (index, bell) {
            let bellNumber = parseInt($(bell).attr('id'))
            let isHand = $(bell).find(".bell_img").attr("src").includes("handstroke")
            state[bellNumber] = isHand?HAND:BACK;
        })

        return state;
    }

    chrome.runtime.onMessage.addListener(function(request) {
        log(request)
        switch(request.type) {
            case "takeAll": 
                window.addEventListener('keydown', takeAllBells)
                break;

            case "takeRemaining":
                window.addEventListener('keydown', takeRemainingBells);
                break;
    
            case "dropAll": 
                window.removeEventListener('keydown', takeAllBells)
                window.removeEventListener('keydown', takeRemainingBells)
                break;
        }
    });
})();