import { fromEvent, interval } from 'https://dev.jspm.io/rxjs@6/_esm2015';
import { ajax } from 'https://dev.jspm.io/rxjs@6/_esm2015/ajax';
import { map, filter, concatMap } from 'https://dev.jspm.io/rxjs@6/_esm2015/operators';

let warningsURL = 'http://localhost:8080/warnings';
let warningsSinceURL = 'http://localhost:8080/warnings/since/';
let severity = 0;
let date = new Date();
date.setSeconds(date.getSeconds()-10);

const pollWarning = url => ajax.getJSON(url)
    .pipe(map(getWarnings))

function getWarnings(data){
    return data.warnings 
}

const shortPollWarning = url => interval(5000)
    .pipe(concatMap(() => ajax.getJSON(url)))
    .pipe(map(getWarnings))
    .pipe(map(res => res.filter(data => data.severity >= severity)))

const addWarning = warning => {
    const warningField = document.getElementById("rxjsBox");
    warningField.textContent = JSON.stringify(warning)
}

const pollChangedWarning = url => ajax.getJSON(url + date.toISOString())
    .pipe(map(getWarnings))

const shortpollChangedWarning = url => interval(5000)
    .pipe(concatMap(() => ajax.getJSON(url + date.toISOString())))
    .pipe(map(getWarnings))
    .pipe(map(res => res.filter(data => data.severity >= severity)))

const addChangedWarning = changedWarning => {
    const changedWarningField = document.getElementById("changesBox");
    changedWarningField.textContent += JSON.stringify(changedWarning)
}

function selectSeverity(){
    let severityDropDown = document.getElementById("severities");
    severity = severityDropDown.options[severityDropDown.selectedIndex].value;
}

const filterSeverity = () => {
let filterButton = document.getElementById("filterButton")
fromEvent(filterButton, 'click')
.subscribe(selectSeverity);
}

function Unsub(){
    // COMMENT: NOT SURE IF WE NEED TO CLEAR THE BOXES AFTER UNSUBSCRIBING!!!
    // const warningField = document.getElementById("rxjsBox");
    // const changedWarningField = document.getElementById("changesBox");
    // warningField.textContent = "";
    // changedWarningField.textContent = "";
    warningsSubscriber.unsubscribe();
    changedWarningsSubscriber.unsubscribe();
}
const unsubscribeToWarnings = () => {
    let unsubscribeButton = document.getElementById("unsubscribe");
    fromEvent(unsubscribeButton,'click')
    .subscribe(Unsub);
}

function Sub(){
    warnings = shortPollWarning(warningsURL);
    changedWarnings = shortpollChangedWarning(warningsSinceURL);
    warnings.subscribe(addWarning);
    changedWarnings.subscribe(addChangedWarning);
}
const subscribeToWarnings = () => {
    let subscribeButton = document.getElementById("subscribe");
    fromEvent(subscribeButton, 'click')
    .subscribe(Sub);
}


let warnings = pollWarning(warningsURL);
let changedWarnings = pollChangedWarning(warningsSinceURL);

warnings.subscribe(addWarning);
changedWarnings.subscribe(addChangedWarning);
changedWarnings = shortpollChangedWarning(warningsSinceURL);
let changedWarningsSubscriber = changedWarnings.subscribe(addChangedWarning);
warnings = shortPollWarning(warningsURL);
let warningsSubscriber = warnings.subscribe(addWarning);


unsubscribeToWarnings();
subscribeToWarnings();
filterSeverity();