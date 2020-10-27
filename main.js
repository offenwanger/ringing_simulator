
(function () {
    const DEBUG = true
    function log(str) {
        if(DEBUG) console.log(str)
    }

    const NO_BELLS = 0;
    const ALL_BELLS = 1;
    const REMAINING_BELLS = 2;
    let mode = NO_BELLS;

    const HAND = true;
    const BACK = false;

    let peelSpeedInHours = 4;
    let changeTime = peelSpeedInHours / 5000 /* hours per row */ * 60 /*minutes*/ * 60 /*seconds*/ * 1000 /* miliseconds */;
    let bellInterval = -1;
    let gracePeriod = -1;
    
    let numberOfbells = -1;
    let stand = false;
    
    let changeEnd = Date.now();
    let place = 0;
    let stroke = HAND;
    let iAmRinging = [];

    let change = [1, 5, 2, 6, 3, 7, 4, 8]

    function onKeyDown(e) {
        if(e.key == "l"){
            // Take my bells, setup
            numberOfbells = getNumberOfBells();
            bellInterval = changeTime / numberOfbells;
            gracePeriod = bellInterval * 2 / 3
            stroke = HAND;
            place = 0;

            if(mode == REMAINING_BELLS) {
                iAmRinging = getUnassignedBells();
            }

            if(mode == ALL_BELLS) {
                iAmRinging = [...Array(numberOfbells + 1).keys()].filter(i => i != 0);
            }

            if(mode == NO_BELLS) {
                iAmRinging = [];
            }

            if(mode != NO_BELLS) {
                setTimeout(function(){ 
                    changeEnd = Date.now();
                    ringNext() 
                }, 2000);
            }
        }
    
        if(e.key == "t"){
            stand = true
        }
    }

    function ringBell(number) {
        window.dispatchEvent(new KeyboardEvent('keydown',{'key':"" + number}));
        log("pressed " + number)
    
        window.dispatchEvent(new KeyboardEvent('keyup',{'key':"" + number}));
        log("released " + number)
    }

    function ringNext() {
        let currentBell = change[place];
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

    function getUnassignedBells() {
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
            case "ringAll": 
                mode = ALL_BELLS;
                break;

            case "ringRemaining":
                mode = REMAINING_BELLS;
                break;
    
            case "ringNone": 
                mode = NO_BELLS;
                break;
        }
    });

    window.addEventListener('keydown', onKeyDown);
})();