import { useEffect, useRef, useState } from "react";
import * as tt from "@tomtom-international/web-sdk-maps";
import * as ttapi from "@tomtom-international/web-sdk-services";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import "./App.css";
import Form from "./Form";

const App = () => {
  const [map, setMap] = useState({});
  const [latitude, setLatitude] = useState(51.5072);
  const [longitude, setLongitude] = useState(0.1276);
  const mapElement = useRef();

  const convertToPoints = (lnglat) => {
    return {
      point: {
        latitude: lnglat.lat,
        longitude: lnglat.lng,
      },
    };
  };

  const drawRoute = (geoJson, map) => {
    if (map.getLayer("route")) {
      map.removeLayer("route");
      map.removeSource("route");
    }
    map.addLayer({
      id: "route",
      type: "line",
      source: {
        type: "geojson",
        data: geoJson,
      },
      paint: {
        "line-color": "#4A89F3",
        "line-width": 6,
      },
    });
  };
  const addDeliveryMarker = (lnglat, map) => {
    const element = document.createElement("div");
    element.className = "marker-delivery";
    new tt.Marker({
      element: element,
    })
      .setLngLat(lnglat)
      .addTo(map);
  };
  useEffect(() => {
    const origin = {
      lng: longitude,
      lat: latitude,
    };

    const destinations = [];

    let map = tt.map({
      key: process.env.REACT_APP_TOM_TOM_API_KEY,
      container: mapElement.current,
      center: [longitude, latitude],
      zoom: 9,
      stylesVisibility: {
        trafficIncidents: true,
        trafficFlow: true,
      },
    });

    setMap(map);

    const addMarker = () => {
      const element = document.createElement("div");
      element.className = "marker";

      const popupOffset = { bottom: [10, -35] };
      const popup = new tt.Popup({
        offset: popupOffset,
      }).setHTML("You are here");

      const marker = new tt.Marker({
        draggable: true,
        element: element,
      })
        .setLngLat([longitude, latitude])
        .addTo(map);

      marker.setPopup(popup).togglePopup();

      marker.on("dragend", () => {
        const lnglat = marker.getLngLat();
        setLatitude(lnglat.lat);
        setLongitude(lnglat.lng);
      });
    };
    addMarker();

    const sortDestinations = (locations) => {
      const pointForDestinations = locations.map((destination) => {
        return convertToPoints(destination);
      });
      const callParameters = {
        key: process.env.REACT_APP_TOM_TOM_API_KEY,
        destinations: pointForDestinations,
        origins: [convertToPoints(origin)],
      };

      return new Promise((resolve, reject) => {
        ttapi.services.matrixRouting(callParameters).then((response) => {
          const results = response.matrix[0];
          const resultsArray = results.map((result, index) => {
            return {
              location: locations[index],
              drivingTime: result.response.routeSummary.travelTimeInSeconds,
            };
          });
          resultsArray.sort((a, b) => {
            return a.drivingTime - b.drivingTime;
          });
          const sortedLocations = resultsArray.map((result) => {
            return result.location;
          });
          resolve(sortedLocations);
        });
      });
    };

    const recalculateRoutes = () => {
      sortDestinations(destinations).then((sorted) => {
        sorted.unshift(origin);
        ttapi.services
          .calculateRoute({
            key: process.env.REACT_APP_TOM_TOM_API_KEY,
            locations: sorted,
          })
          .then((routeData) => {
            const geoJson = routeData.toGeoJson();
            drawRoute(geoJson, map);
          });
      });
    };
    map.on("click", (e) => {
      destinations.push(e.lngLat);
      addDeliveryMarker(e.lngLat, map);
      recalculateRoutes();
    });

    return () => map.remove();
  }, [longitude, latitude]);

  const coordsHandler = (lat, long) => {
    setLatitude(+lat);
    setLongitude(+long);
  };

  return (
    <>
      {map && (
        <div className="App">
          <div ref={mapElement} className="map"></div>
          <Form onChange={coordsHandler} />
        </div>
      )}
    </>
  );
};

export default App;
