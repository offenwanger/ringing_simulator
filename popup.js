// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#ringAll').addEventListener('click', () => { 
        document.querySelector('#console').innerHTML= "Took All Bells"
        message("ringAll") 
    });

    document.querySelector('#ringRemaining').addEventListener('click', () => { 
        document.querySelector('#console').innerHTML= "Taken remaining Bells"
        message("ringRemaining") 
    });

    
    document.querySelector('#ringNone').addEventListener('click', () => { 
        document.querySelector('#console').innerHTML= "Dropped All Bells"
        message("ringNone") 
    });
  
});

function message(type, parameters = {}) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {type, ...parameters});
    });
}
