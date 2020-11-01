
(function () {
    const DEBUG = true
    function log(str) {
        if(DEBUG) console.log(str)
    }

    const NO_BELLS = 0;
    const ALL_BELLS = 1;
    const REMAINING_BELLS = 2;
    let mode = REMAINING_BELLS;

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
        let key = number
        if(number == 10) {
            key = 0
        } else if(number == 11) {
            key = "-"
        } else if(number == 12) {
            key = "="
        }
        window.dispatchEvent(new KeyboardEvent('keydown',{'key':"" + key}));
        log("pressed " + number)
    
        window.dispatchEvent(new KeyboardEvent('keyup',{'key':"" + key}));
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

    function createFAB() {
        let FAB = $("<div>").attr("style","position: fixed; bottom: 5%; right: 5%");
        let image = $("<img>").attr("src", chrome.extension.getURL('icon.svg')).attr("width","50px").attr("height","50px");
        FAB.append(image)
        return FAB;
    }

    function createInterface() {
        let interface = $("<div>").attr("class","dialog").attr("id", "simulator-interface");
        interface.on("click", function(e) {
            if($(e.target).attr("id") == interface.attr("id")) {
                interface.hide()
            }
        });

        let content = $("<div>").attr("class","dialog-content");
        interface.append(content);
        
        let header = $("<h3>").html("Ringing Simulator");
        content.append(header);

        let modeSelector = $("<select>");
        modeSelector.append($("<option>").attr("value", REMAINING_BELLS).html("Ring Remaining Bells"));
        modeSelector.append($("<option>").attr("value", ALL_BELLS).html("Ring All Bells"));
        modeSelector.append($("<option>").attr("value", NO_BELLS).html("Ring No Bells"));
        modeSelector.on("change", function() {
            console.log(this.value)
            mode = this.value
        })
        modeSelector.val(mode);
        content.append(modeSelector);
        content.append($("<br>"))

        getMethods().then((data) => {
            console.log(data);
        }).catch((error) => {
            console.error(error);
        });

        let doneButton = $("<button>").html("Done").on("click", function() { interface.hide(); })
        content.append(doneButton);

        return interface
    }

    function getMethods() {
        console.log("making methods request");
        return new Promise((resolve, reject) => {
            $.ajax({
                url: 'https://vivacious-port.glitch.me/find/methods',
                type: 'GET',
                success: function (data) {
                    resolve(data);
                },
                error: function (data) {
                    reject(data);
                }
            });
        });
    }

    window.addEventListener('keydown', onKeyDown);

    let FAB = createFAB();
    let interface = createInterface();

    interface.hide();
    FAB.on("click", function (){
        interface.show();
    });

    $("body").append(FAB)
    $("body").append(interface)

})();