import { Component, OnInit, OnDestroy, EventEmitter, Output, Input, HostListener } from '@angular/core';
import { RXCore } from 'src/rxcore';
import { AnnotationToolsService } from '../annotation-tools.service';
import { Subscription } from 'rxjs';
import { ColorHelper } from 'src/app/helpers/color.helper';
import { MARKUP_TYPES, METRIC } from 'src/rxcore/constants';
import { RxCoreService } from 'src/app/services/rxcore.service';
import { ToastrService } from 'ngx-toastr';
import { MeasurePanelService } from './measure-panel.service';

@Component({
  selector: 'rx-measure-panel',
  templateUrl: './measure-panel.component.html',
  styleUrls: ['./measure-panel.component.scss'],
})
export class MeasurePanelComponent implements OnInit, OnDestroy {
  @Input() maxHeight: number = Number.MAX_SAFE_INTEGER;
  @Input() draggable: boolean = true;
  @Output() onClose: EventEmitter<void> = new EventEmitter<void>();
  bounds: HTMLElement | null = document.getElementById("mainContent");

  private stateSubscription: Subscription;
  private guiMarkupSubscription: Subscription;

  MARKUP_TYPES = MARKUP_TYPES;

  visible: boolean = false;
  created: boolean = true;
  type: number = MARKUP_TYPES.MEASURE.LENGTH.type;
  color: string;
  lengthMeasureType: number;
  strokeThickness: number;
  strokeLineStyle: number;
  snap: boolean;

  metricUnitTypes = METRIC.UNIT_TYPES;
  metricTitles = METRIC.UNIT_TITLES;
  metricUnits = METRIC.UNITS;
  scales = METRIC.UNITS.SCALES;

  metricTitlesOptions: any = [];
  metricUnitsOptions: any = [];
  scalesOptions: any = [];
  precisionOptions: any = [];
  selectedMetric: string;
  selectedMetricTitle: string;
  selectedMetricUnit: any;
  selectedScale: any;
  calibrateLength: string;
  calibrateScale: string;
  isSelectedCalibrate: boolean;
  isCalibrateFinished: boolean;
  isPrecisionChanged: boolean;
  currentScale: string;
  selectedScalePrecision: any;
  isDoubleClicked: boolean;

  private _setDefaults(): void {
    this.created = false;
    this.type = MARKUP_TYPES.MEASURE.LENGTH.type;
    this.color = '#333C4E';
    this.strokeThickness = 1;
    this.strokeLineStyle = 0;
    this.lengthMeasureType = 0;
    this.snap = false;
    this.calibrateLength = "0";
    this.calibrateScale = '';
    this.isSelectedCalibrate = false;
    this.isCalibrateFinished = false;
    this.isPrecisionChanged = false;
    this.currentScale = `1 Millimeter : 1 Millimeter`;
    this.isDoubleClicked = false;
    

    this.scales.forEach(item => {
      let obj = { value: item, label: item };
      this.scalesOptions.push(obj);
    });
    this.selectedScale = this.scalesOptions[0];

    Object.entries(this.metricUnits['0']).forEach(([key, value]) => {
      let obj = { value: key, label: value };
      this.metricUnitsOptions.push(obj);
    });
    this.selectedMetricUnit = this.metricUnitsOptions[0];
    
    Object.entries(this.metricTitles).forEach(([key, value]) => {
      let obj = { value: key, label: value };
      this.metricTitlesOptions.push(obj);
    }); 
    this.selectedMetric = '0';
    
    let precisionOptionsArr = [1, 0.1, 0.01, 0.001, 0.0001];
    precisionOptionsArr.forEach(item => {
      let obj = { value: item, label: item };
      this.precisionOptions.push(obj);
    });
    this.selectedScalePrecision = this.precisionOptions[2];
  }

  constructor(
    private readonly rxCoreService: RxCoreService,
    private readonly annotationToolsService: AnnotationToolsService,
    private readonly colorHelper: ColorHelper,
    private readonly service: MeasurePanelService,
    private toastr: ToastrService) {}

  ngOnInit(): void {
    this._setDefaults();
    
    this.stateSubscription = this.annotationToolsService.measurePanelState$.subscribe(state => {
      this.visible = state.visible;
      this.service.setMeasureScaleState({visible: state.visible, value: this.currentScale});
    });

    this.rxCoreService.guiCalibrateFinished$.subscribe(state => {
      this.calibrateLength = parseFloat(state.data || "0").toFixed(this.countDecimals(this.selectedScalePrecision?.value));
      this.isCalibrateFinished = state.isFinished;
      if(state.isFinished) {
        this.calibrateScale = this.currentScale;
      }
    });   
    

    // this.guiMarkupSubscription = this.rxCoreService.guiMarkup$.subscribe(({markup, operation}) => {
    //   this._setDefaults();
    //   this.visible = false;

    //   if (markup == -1 || operation.deleted) {
    //     return;
    //   }

    //   this.type = markup.type;
    //   this.color = this.colorHelper.rgbToHex(markup.strokecolor);
    //   this.strokeThickness = markup.linewidth;
    //   this.strokeLineStyle = markup.linestyle;
    //   this.lengthMeasureType = markup.subtype;
    // });
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) this.stateSubscription.unsubscribe();
    if (this.guiMarkupSubscription) this.guiMarkupSubscription.unsubscribe();
  }

  onLengthMeasureTypeChange(type: number): void {
    this.lengthMeasureType = type;
    if (this.created) {
      RXCore.markUpDimension(true, type);
    } else {
      RXCore.markUpSubType(type);
    }
  }

  onColorSelect(color): void {
    this.color = color;
    RXCore.setGlobalStyle(true);
    RXCore.changeStrokeColor(color);
  }

  onStrokeThicknessChange(): void {
    RXCore.setLineWidth(this.strokeThickness);
  }

  onStrokeLineStyleSelect(lineStyle: number): void {
    this.strokeLineStyle = lineStyle;
    RXCore.setLineStyle(lineStyle);
  }

  onSnapChange(onoff: boolean): void {
    RXCore.changeSnapState(onoff);
  }

  selectMetric(event): void {
    console.log("selectMetric", event);
    let metric = event.value;
    if (this.selectedMetric !== metric) {
        this.updateMetricDropDowns(metric);
        switch (metric){
         case '0' :
          RXCore.setUnit(1);
          break;
         case '1' :
          RXCore.setUnit(2);
          break;
        } 
        
        this.notifyMetricChanged('0');
    }
  };

  selectMetricUnit(event): void {
      let val = event.label;
      let obj = this.metricUnitsOptions.find(item => item.value === event.value);
      this.selectedMetricUnit = obj;
      this.notifyMetricChanged(val);      
  };

  notifyMetricChanged(val): void {
      if (this.selectedMetric === METRIC.UNIT_TYPES.METRIC ) {          
          RXCore.metricUnit(val);          
      } else if (this.selectedMetric === METRIC.UNIT_TYPES.IMPERIAL ) {          
          RXCore.imperialUnit(val);
      }

      if(this.isSelectedCalibrate && this.isCalibrateFinished) {
        RXCore.scale('Calibration');
        this.calibrateScaleWithPrecision();
      } else {
        RXCore.scale(this.selectedScale?.value);
      }
  }

  updateMetricDropDowns(metric): void {
      this.selectedMetric = metric;
      this.selectedMetricTitle = this.metricTitles[this.selectedMetric];
      var units =  this.metricUnitsForMetric(this.selectedMetric);
      console.log("units", units);

      this.metricUnitsOptions = [];
      Object.entries(units).forEach(([key, value]) => {
        let obj = { value: key, label: value };
        this.metricUnitsOptions.push(obj);
      });
      this.selectedMetricUnit = this.metricUnitsOptions[0];

      let k;
      for (k in units) {
          console.log("units k", k);
          break;
      }
      // this.selectedMetricUnit = units[k];

      for (k in this.scales) {
          console.log("scales k", k);
          break;
      }
      // this.selectedScale = this.scales[k];
      this.selectedScale = this.scalesOptions[0];
  }

  metricUnitsForMetric(metric): any {
      return this.metricUnits[metric];
  }

  onScaleChanged(event): void {
    this.selectedScale = this.scalesOptions.find(item=>item.value === event.value);
  }
  
  calibrateScaleWithPrecision(){
    var calibrateconn = RXCore.getCalibrateGUI();    
    let measureScale = parseFloat(calibrateconn.getMeasureScale());
    let measureSc = measureScale.toFixed(2);
    calibrateconn.setCalibrateScale(measureSc);
    RXCore.scale('Calibration');
    this.currentScale = `1 ${this.selectedMetricUnit?.label} : ${measureSc} ${this.selectedMetricUnit?.label}`;
  }

  onScalePrecisionChanged(event): void {
    this.selectedScalePrecision = this.precisionOptions.find(item=>item.value === event.value);
  }


  onCloseClick(): void {
    this.visible = false;
    this.annotationToolsService.setMeasurePanelState({ visible: false });
    this.onClose.emit();    
  }

  calibrate(selected) {
    RXCore.onGuiCalibratediag(onCalibrateFinished);
    let rxCoreSvc = this.rxCoreService;
    function onCalibrateFinished(data) {
        rxCoreSvc.setCalibrateFinished(true, data);        
    }

    RXCore.calibrate(selected);
  }

  onCalibrateCheckedChange() {
    if(this.isSelectedCalibrate) {
      this.calibrate(true);
    } else {
      this.cancelCalibrate();
    }
  }

  resetCalibrate() {
      this.isCalibrateFinished = false;
      this.calibrate(true);
  }
  
  countDecimals(value) {
    return value % 1?value.toString().split(".")[1].length:0;     
  };

  setScale() {
    let scaleArr = this.selectedScale.value.split(":");
    this.currentScale = `${scaleArr[0]} ${this.selectedMetricUnit?.label} : ${scaleArr[1]} ${this.selectedMetricUnit?.label}`;
  }

  applyScale() {    
    RXCore.setdimPrecision(this.countDecimals(this.selectedScalePrecision?.value));
    RXCore.scale(this.selectedScale?.value);
    
    this.setScale();
    this.service.setMeasureScaleState({visible: true, value: this.currentScale});
    if(this.isSelectedCalibrate) {      
      this.isSelectedCalibrate = false;
      this.isCalibrateFinished = false;
    }

    this.showSuccess();
    this.onCloseClick();
  }

  setCalibrateScale() {
    var calibrateconn = RXCore.getCalibrateGUI(); 
    calibrateconn.SetTempCal(this.calibrateLength);
    calibrateconn.setCalibrateScaleByLength();
    let measureScale = parseFloat(calibrateconn.getMeasureScale());
    let measureSc = measureScale.toFixed(2);    
    this.currentScale = `1 ${this.selectedMetricUnit?.label} : ${measureSc} ${this.selectedMetricUnit?.label}`;
  }

  applyCalibrate() {    
    this.calibrateLength = this.calibrateLength.trim();
    var calibrateconn = RXCore.getCalibrateGUI();
    calibrateconn.SetTempCal(this.calibrateLength);
    calibrateconn.setCalibration(true);

    RXCore.setdimPrecision(this.countDecimals(this.selectedScalePrecision?.value));
    RXCore.scale('Calibration');

    this.calibrateScaleWithPrecision();
    this.service.setMeasureScaleState({visible: true, value: this.currentScale});
    RXCore.calibrate(false);
    this.showSuccess();
    this.onCloseClick();
  }

  cancelCalibrate(): void {
    RXCore.calibrate(false);
    RXCore.scale(this.selectedScale?.value);
    this.isSelectedCalibrate = false;
    this.isCalibrateFinished = false;
    this.calibrateLength = "0";
  }

  showSuccess() {
    this.toastr.success('Start measuring by selecting one of the measurement tools.', 'Scale has been successfully set', {      
      positionClass: 'toast-bottom-right',
      timeOut: 3000,
    });
  }
}
