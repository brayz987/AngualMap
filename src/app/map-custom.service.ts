import { EventEmitter, Injectable } from '@angular/core';
import * as MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { environment } from '../environments/environment';
import * as mapboxgl from 'mapbox-gl';
import { HttpClient, HttpClientModule } from '@angular/common/http'; 
import { WayPoints } from './app.component';
import { Socket } from 'ngx-socket-io';
import { core } from '@angular/compiler';


@Injectable({
  providedIn: 'root'
})
export class MapCustomService {

  cbAddress :EventEmitter<any> = new EventEmitter<any>();
  
  mapbox = mapboxgl as typeof mapboxgl;
  style = 'mapbox://styles/mapbox/streets-v11';
  lat = 4.694136176191146;
  lng = -74.04876423995871;
  zoom = 10;
  wayPoints:Array<any> | undefined;
  markerDriver:any = null;



  map:mapboxgl.Map | undefined;
  constructor( private httpClient:HttpClient, private socket:Socket ) { 
    this.mapbox.accessToken = environment.mapPK;
  }

  buildMap():Promise<any> {
    return new Promise((resolve, reject) =>{
      try {
      /* Se construye el mapa */
      this.map = new mapboxgl.Map({
        container: 'map',
        style: this.style,
        zoom: this.zoom,
        center: [this.lng, this.lat]
      });

      // this.map.addControl(new mapboxgl.NavigationControl());


      // Aqui construimos el imput del geocoder//
      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken
      })


      /// obtener resultado seteado

      geocoder.on('result', ($event) =>{
        const {result} = $event;
        geocoder.clear();
        // console.log('***********', result);
        this.cbAddress.emit(result);
      });

      resolve({
        map: this.map,
        geocoder
      });
    } catch (e) {
        reject (e);
      }
  })};

  loadCoords(coords:any):void {
    // console.log(coords);
    const url = [
      `https://api.mapbox.com/directions/v5/mapbox/driving/`,
      `${coords[0][0]},${coords[0][1]};${coords[1][0]},${coords[1][1]}`,
      `?steps=true&geometries=geojson&access_token=${environment.mapPK}`,
    ].join(``);


    this.httpClient.get(url).subscribe((result:any)=>{
      const data = result.routes[0];
      const route:Array<any> = data.geometry.coordinates;
      this.map?.addSource('route',{
        type:'geojson',
        data:{
          type:'Feature',
          properties: {},
          geometry:{
            type:'LineString',
            coordinates: route,
          }
        }
      });
      this.map?.addLayer({
        id:'route',
        type:'line',
        source:'route',
        layout: {
          'line-join':'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color':'green',
          'line-width': 5
        }
      });


      this.wayPoints = route;
      this.map?.fitBounds([route[0], route[route.length - 1]], {
        padding: 100,
      })


      this.socket.emit('find-driver', {points: route});


    });

  }

  addMarkerCursor(coords:any):void {
     const e1 = document.createElement('div');
     e1.className = 'marker';
     if(!this.markerDriver){{
      this.markerDriver = new mapboxgl.Marker(e1);
     }}else{
      this.markerDriver
      .setLngLat(coords.coords)
      .addTo(this.map);
     }
  }

}
