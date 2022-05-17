import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MapCustomService } from './map-custom.service';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  @ViewChild('asGeoCoder') asGeoCoder!: ElementRef;
  modeInput = 'start';

  wayPoints:WayPoints = {start: null, end: null};
  
  constructor(private MapCustomService:MapCustomService, private render2:Renderer2, private socket:Socket){

  }


  ngOnInit(): void {
      this.MapCustomService.buildMap()
      .then(({geocoder, map}) => {
        this.render2.appendChild(this.asGeoCoder.nativeElement,
          geocoder.onAdd(map)
          )
        console.log( "Todo nice")
      })
      .catch((err) => {
        console.log( "Todo mal", err)
      })

      this.MapCustomService.cbAddress.subscribe((getPoing) =>{
        if(this.modeInput === 'start'){
          this.wayPoints.start = getPoing;
        }
        if(this.modeInput === 'end'){
          this.wayPoints.end = getPoing;
        }
      });
      
      
      this.socket.fromEvent('position')
      .subscribe((coords) => {
        console.log('***********DESDE SOCKET', coords);
        this.MapCustomService.addMarkerCursor(coords);
      });

  }
  
  changeMode(mode:string):void{
    this.modeInput = mode;
  }


  drawRoute(){
    // console.log("******* PUNTOS DE ORIGEN Y DESTINO ***", this.wayPoints.start)

    const coords = [
      this.wayPoints.start.center,
      this.wayPoints.end.center,
    ]
    this.MapCustomService.loadCoords(coords);
  }


  testMarker(){
    this.MapCustomService.addMarkerCursor([ -70.63222378444414, -33.56788674965661])
  }
}


export class WayPoints {
  start:any
  end:any
}
