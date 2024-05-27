import { Component, OnInit, OnDestroy, EventEmitter, Input, Output } from '@angular/core';
import { RXCore } from 'src/rxcore';
import { AnnotationToolsService } from '../annotation-tools.service';
import { Subscription } from 'rxjs';
import { ColorHelper } from 'src/app/helpers/color.helper';
import { MARKUP_TYPES } from 'src/rxcore/constants';
import { RxCoreService } from 'src/app/services/rxcore.service';

@Component({
  selector: 'rx-measure-detail-panel',
  templateUrl: './measure-detail-panel.component.html',
  styleUrls: ['./measure-detail-panel.component.scss'],
})
export class MeasureDetailPanelComponent implements OnInit, OnDestroy {
  @Input() maxHeight: number = Number.MAX_SAFE_INTEGER;
  @Input() draggable: boolean = true;
  @Output() onClose: EventEmitter<void> = new EventEmitter<void>();
  private stateSubscription: Subscription;
  private guiMarkupSubscription: Subscription;
  private guiMarkupMeasureRealTimeDataSubscription: Subscription;

  MARKUP_TYPES = MARKUP_TYPES;

  panelHeading: string = '';
  measurementText: string = 'Distance'
  visible: boolean = false;
  measureData: any = {};
  markup: any;

  constructor(
    private readonly rxCoreService: RxCoreService,
    private readonly annotationToolsService: AnnotationToolsService,
    private readonly colorHelper: ColorHelper) {}

  ngOnInit(): void {


    this.stateSubscription = this.annotationToolsService.measurePanelDetailState$.subscribe(state => {
      this.visible = state.visible;
      if(!this.visible){
        //this.measureData.dimtext = "0.0";
        this.measureData = {
          dimtext : "0.0"
        };

      }

      switch(state.type){
        case MARKUP_TYPES.MEASURE.LENGTH.type :
          this.panelHeading = "Distance Measurement";
          this.measurementText = "Distance";
          
        break;
        case MARKUP_TYPES.MEASURE.AREA.type :
          this.panelHeading = "Area Measurement";  
          this.measurementText = "Area";
        break;
        case MARKUP_TYPES.MEASURE.PATH.type :
          this.panelHeading = "Perimeter Measurement";
          this.measurementText = "Distance";
        break;


      }

      

      // this.created = Boolean(state.created);
      // if (this.created) {
      //   this.type = state.type;
      // }
    });


    this.guiMarkupMeasureRealTimeDataSubscription = this.rxCoreService.guiMarkupMeasureRealTimeData$.subscribe(({markup}) => {
      this.manageRealTimeBox(markup);
    });

    this.annotationToolsService.propertiesPanelState$.subscribe(state => {
      this.markup = state?.markup;

      if(this.markup?.type === MARKUP_TYPES.MEASURE.LENGTH.type) {
        this.panelHeading = "Distance Measurement";
        this.measurementText = "Distance";
      } else if(this.markup?.type === MARKUP_TYPES.MEASURE.PATH.type) {
        this.panelHeading = "Perimeter Measurement";
        this.measurementText = "Distance";
      } else if(this.markup?.type === MARKUP_TYPES.MEASURE.AREA.type) {
        this.panelHeading = "Area Measurement";
        this.measurementText = "Area";
      }
      
    });

    this.rxCoreService.guiMarkupIndex$.subscribe(({markup, operation}) => {
      this.manageRealTimeBox(markup);
    });

    this.rxCoreService.guiMarkup$.subscribe(({markup, operation}) => {
      //Hide real time box when one of measure tool deleted
      if(operation.deleted || markup === -1) {
        this.visible = false;
      }
      
      if(operation.modified) {
        this.manageRealTimeBox(markup);
      }
    });

    this.rxCoreService.guiConfig$.subscribe(config => {
      if(config.disableMarkupMeasureButton === true) {
        this.visible = false;
      }
    });

  }

  manageRealTimeBox(markup) {
    this.measureData = markup;
      
      if(markup !== -1) {

        switch(markup.type){
          case MARKUP_TYPES.MEASURE.LENGTH.type :
            this.panelHeading = "Distance Measurement";
            this.measurementText = "Distance";
            this.visible = true;
            
          break;
          case MARKUP_TYPES.MEASURE.AREA.type :
            this.panelHeading = "Area Measurement";  
            this.measurementText = "Area";
            this.visible = true;
          break;
          case MARKUP_TYPES.MEASURE.PATH.type :
            this.panelHeading = "Perimeter Measurement";
            this.measurementText = "Distance";
            this.visible = true;
          break;

          case 13 :
            this.measurementText = "Count";
            this.panelHeading = "Count";
            this.visible = true;
  
            break;
          default :
            this.visible = false;
            break;
  
  
        }
        
      }
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) this.stateSubscription.unsubscribe();
    if (this.guiMarkupSubscription) this.guiMarkupSubscription.unsubscribe();
    if (this.guiMarkupMeasureRealTimeDataSubscription) this.guiMarkupMeasureRealTimeDataSubscription.unsubscribe();
  }
   

}
