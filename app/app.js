'use strict';

// Declare app level module which depends on views, and core components
const ap = angular.module('myApp', [
  'ngRoute',
  'myApp.version'
]).
config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider.otherwise({redirectTo: '/view1'});
}]);

ap.controller('ctrl', function($scope, $http) {
  $scope.current = {
    city: ""
  };

  $scope.fData = {
    type: "",
    time: "",
    place: "",
    value: 0,
    unit: ""};

  $scope.theDate = {
        year : 0,
        month : 0,
        date : 0,
        hour : 0
  };

  $scope.startDate = {
    year : 0,
    month : 0,
    date : 0,
    hour : 0
  };

  $scope.endDate = {
    year : 0,
    month : 0,
    date : 0,
    hour : 0
  };

  $scope.severity = 0;
  let severityData = {};
  let oldData = {};
  let oldDataTime = "";
  let newDataTime = "";

  $scope.displayDataInInterval = async function() {
    const startingDate = new Date($scope.startDate.year, ($scope.startDate.month-1), $scope.startDate.date, $scope.startDate.hour, 0, 0, 0);
    const endingDate = new Date($scope.endDate.year, ($scope.endDate.month-1), $scope.endDate.date, $scope.endDate.hour, 0, 0, 0);
    const result = await fetch('http://localhost:8080/data');
    const resultForecast = await fetch('http://localhost:8080/forecast');
    const resultJson = await result.json();
    const resultForecastJson = await resultForecast.json();

    const his = resultJson.filter(x => {
      const d = new Date(x.time);
      return inInterval(d, startingDate, endingDate);
    }).filter(x => {
      return $scope.current.city === x.place;
    });

    const fore = resultForecastJson.filter(x => {
      const d = new Date(x.time);
      return inInterval(d, startingDate, endingDate);
    }).filter(x => {
      return $scope.current.city === x.place;
    });

    $scope.$apply(displayInterval(his, fore));
  };

  function displayInterval(his, fore) {
    $scope.sortedHisData = his;
    $scope.sortedForecastData = fore;
  }

  function inInterval(d, startingDate, endingDate) {
    return (d.getTime() > startingDate.getTime() && d.getTime() < endingDate.getTime())
  }

  $scope.postHistoricalData = function () {
    const myDate = new Date($scope.theDate.year, ($scope.theDate.month-1), $scope.theDate.date, $scope.theDate.hour, 0, 0, 0).toISOString();
    $scope.fData.time = myDate;
    const url = 'http://localhost:8080/data';
    $http.post(url, [$scope.fData]).then(a => {
      console.log(a);
    }, e => {
      console.log(e);
    });
  };

  function contains(date) {
    const toDate = new Date();
    if (date.getTime() > (toDate.getTime()-432000000) && date.getTime() < toDate.getTime()) {
      return true
    }
    return false;
  }

  const mostRecent = (l) => new Date(Math.max.apply(null, l.map( e => {
    return new Date(e.time);
  })));

  function displayData(result, city) {
    const filteredByCity = result.filter(x => {
      return x.place === city;
    });
    const lastDays = filteredByCity.filter(x => {
      const d = new Date(x.time);
      return contains(d);
    }).filter(x => {
      return x.type === 'precipitation';
    }).reduce((x,y) => x + y.value, 0);

    const windSpeed = filteredByCity.filter(x => {
      const d = new Date(x.time);
      return contains(d);
    }).filter(x => {
      return x.type === 'wind speed';
    });

    const minTemperature = Math.min(...filteredByCity.filter(x => {
      const date = new Date(x.time);
      return contains(date);
    }).filter(x => {
      return x.type === 'temperature';
    }).map(x => x.value));

    const maxTemperature = Math.max(...filteredByCity.filter(x => {
      const date = new Date(x.time);
      return contains(date);
    }).filter(x => {
      return x.type === 'temperature';
    }).map(x => x.value));

    const getLatestData1 = () => {
      var temperatureList = filteredByCity.filter(x => {
        return x.type == 'temperature';
      });
      var temperature = temperatureList.filter(x => {
        return (new Date(x.time)).getTime() == mostRecent(temperatureList).getTime();
      })[0];
      var precipitationList = filteredByCity.filter(x => {
        return x.type == 'precipitation';
      });
      var precipitation = precipitationList.filter(x => {
        return (new Date(x.time)).getTime() == mostRecent(precipitationList).getTime();
      })[0];
      var windspeedList = filteredByCity.filter(x => {
        return x.type == 'wind speed';
      });
      var windspeed = windspeedList.filter(x => {
        return (new Date(x.time)).getTime() == mostRecent(windspeedList).getTime();
      })[0];
      var cloudList = filteredByCity.filter(x => {
        return x.type == 'cloud coverage';
      });
      var cloud = cloudList.filter(x => {
        return (new Date(x.time)).getTime() == mostRecent(cloudList).getTime();
      })[0];
      return [JSON.stringify(temperature), JSON.stringify(precipitation), JSON.stringify(windspeed), JSON.stringify(cloud)]
    };

    const cloudCoverage = filteredByCity.filter(x => {
      const date = new Date(x.time);
      return contains(date);
    }).filter(x => {
      return x.type === 'cloud coverage';
    });

    const averageWindSpeed = (windSpeed.reduce((x,y) => x + y.value, 0))/windSpeed.length;
    const averageCloudCoverage = (cloudCoverage.reduce((x,y) => x + y.value, 0))/cloudCoverage.length;

    const directions = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];
    const numberOfDirections = [0, 0, 0, 0, 0, 0, 0, 0];

    windSpeed.forEach(x => {
      directions.forEach(y => {
        if(x.direction === y) {
          numberOfDirections[directions.indexOf(y)] ++;
        }
      })
    });

    const mostFrequent = numberOfDirections.reduce(function(a, b) {
      return Math.max(a, b);
    });

    $scope.onex = getLatestData1().toString();
    $scope.two = Math.round(minTemperature).toString();
    $scope.three = Math.round(maxTemperature).toString();
    $scope.four = Math.round(lastDays).toString();
    $scope.five = Math.round(averageWindSpeed).toString();
    $scope.six = directions[numberOfDirections.indexOf(mostFrequent)];
    $scope.seven = Math.round(averageCloudCoverage).toString();

  }
  function displayFutureData(result) {
    $scope.eight = result;
  }

  $scope.getData =  async function (place) {
    const result = await fetch('http://localhost:8080/data');
    const resultJson = await result.json();
    $scope.$apply(displayData(resultJson, place));
    getFutureDataHttp(place);
  }

  function getDataHttp(place) {
    const Http = new XMLHttpRequest();
    const url = 'http://localhost:8080/data';
    Http.open('GET', url);
    Http.send();
    Http.onreadystatechange = function () {
      if(this.readyState === 4 && this.status === 200) {
        console.log(Http.responseText);
        const result = Http.responseText.split(', ');
        displayData(result, place);
      }
    }
  }
  function getFutureDataHttp(place) {
    const Http = new XMLHttpRequest();
    const url = 'http://localhost:8080/forecast/'+place;
    Http.open('GET', url);
    Http.send();
    Http.onreadystatechange = function () {
      if(this.readyState === 4 && this.status === 200) {
        console.log(Http.responseText);
        const result = Http.responseText.split(', ');
        $scope.$apply(displayFutureData(result));
      }
    }
  }
  let socket;
  $scope.turnOn = function () {
    socket = new WebSocket(" ws://localhost:8090/warnings");
    socket.onopen = function (event) {
      socket.send("subscribe");
    };
    socket.onmessage = function (event) {

      if(JSON.parse(event.data).hasOwnProperty("warnings")) {
        let date = new Date();
        date.setSeconds(date.getSeconds()-10);
        newDataTime = new Date(date).toISOString();
        severityData = JSON.parse(event.data);
      }
      else {
        let date = new Date();
        date.setSeconds(date.getSeconds()-10);
        newDataTime = new Date(date).toISOString();
        const updateData = JSON.parse(event.data);
        let found = false;
        for (let i of severityData.warnings) {
          if ((updateData.id === i.id)) {
            severityData.warnings[i] = updateData;
            found = true;
            break;
          }
        }
        if (!found){
          severityData.warnings.push(updateData);
        }
      }
      $scope.filterBySeverity();
    }
  };
  $scope.turnOn();

  $scope.turnOff = function () {
      socket.send("unsubscribe");
    $scope.socketRes = "";
  };

  $scope.filterBySeverity = function () {
    const result = severityData.warnings.filter(warning => {
      return warning.severity >= $scope.severity;
    });
    $scope.$apply($scope.socketRes = result);
  };

  $scope.showDifferences = async function () {
    const result = await fetch('http://localhost:8080/warnings/since/'+newDataTime);
    const resultJson = await result.json();
    $scope.$apply($scope.socketChanges = resultJson.warnings);
  }
});