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
  measuredCalibrateLength: string;
  calibrateScale: string;
  isSelectedCalibrate: boolean;
  isCalibrateFinished: boolean;
  isPrecisionChanged: boolean;
  currentScale: string;
  selectedScalePrecision: any;
  isDoubleClicked: boolean;
  selectedMetricOptionObj: any;
  activeScale: string;
  isActivefile: boolean;


  scaleOrCalibrate: number;
  customPageScaleValue: number;
  customDisplayScaleValue: number;
  metricUnitsOptionsForPage: any = [];
  metricUnitsOptionsForDisplay: any = [];
  selectedMetricUnitForPage: any;
  selectedMetricUnitForDisplay: any;

  private _setDefaults(): void {
    this.created = false;
    this.type = MARKUP_TYPES.MEASURE.LENGTH.type;
    this.color = '#333C4E';
    this.strokeThickness = 1;
    this.strokeLineStyle = 0;
    this.lengthMeasureType = 0;
    this.snap = false;
    this.calibrateLength = "0";
    this.measuredCalibrateLength = "0";
    this.calibrateScale = '';
    this.isSelectedCalibrate = false;
    this.isCalibrateFinished = false;
    this.isPrecisionChanged = false;
    this.currentScale = `1 Millimeter : 1 Millimeter`;
    this.isDoubleClicked = false;
    this.scaleOrCalibrate = 0;
    this.customPageScaleValue = 1;
    this.customDisplayScaleValue = 1;

    let allMetricUnits = {...this.metricUnits['0'], ...this.metricUnits[1]};
    Object.entries(allMetricUnits).forEach(([key, value]) => {
      let obj = { value: key, label: value };
      this.metricUnitsOptions.push(obj);
      this.metricUnitsOptionsForDisplay.push(obj);
      if(value === 'Millimeter' || value === 'Centimeter' || value === 'Inch')
        this.metricUnitsOptionsForPage.push(obj);
    });
    this.selectedMetricUnit = this.metricUnitsOptions[0];
    this.selectedMetricUnitForPage = this.metricUnitsOptionsForPage[0];
    this.selectedMetricUnitForDisplay = this.metricUnitsOptionsForDisplay[0];
    
    Object.entries(this.metricTitles).forEach(([key, value]) => {
      let obj = { value: key, label: value };
      this.metricTitlesOptions.push(obj);
    }); 
    this.selectedMetric = '0';
    this.selectedMetricOptionObj = this.metricTitlesOptions[0];
    
    let precisionOptionsArr = [1, 0.1, 0.01, 0.001, 0.0001];
    precisionOptionsArr.forEach(item => {
      let obj = { value: item, label: item };
      this.precisionOptions.push(obj);
    });
    this.selectedScalePrecision = this.precisionOptions[2];

    let obj = { 
      value: "1:1", 
      label: "1 Millimeter : 1 Millimeter",
      selectedMetric: "0",
      selectedMetricUnitForDisplay: this.selectedMetricUnitForDisplay
    };
    this.scalesOptions.push(obj);
    this.selectedScale = obj;    
    this.saveScaleToLocalStorage();
    this.selectedScale = this.scalesOptions[0];
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
      this.service.setMeasureScaleState({ visible: state.visible });

      if(this.visible && !this.currentScale) {
        this.currentScale = '1 Millimeter : 1 Millimeter';
      }
    });



    this.rxCoreService.guiCalibrateFinished$.subscribe(state => {
      this.calibrateLength = parseFloat(state.data || "0").toFixed(this.countDecimals(this.selectedScalePrecision?.value));
      this.measuredCalibrateLength = this.calibrateLength;
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
    this.rxCoreService.guiConfig$.subscribe(config => {
      if(config.disableMarkupMeasureButton === true) {
        this.visible = false;
      }
    });

    this.rxCoreService.guiState$.subscribe(state => {
      if(state?.activefile) {
        this.isActivefile = true;
      }
    });

    this.rxCoreService.guiPage$.subscribe((state) => {      
      const scaleValue = RXCore.getCurrentPageScaleValue();
      
      if(!scaleValue) {
        return;
      }
      this.selectedScale = this.scalesOptions.find(item=>item.value === scaleValue);
      this.currentScale = this.selectedScale.label;
      this.service.setMeasureScaleState({visible: true, value: this.currentScale});
    });   
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
  
  selectMetricUnit(event): void {
    let obj = this.metricUnitsOptions.find(item => item.value === event.value);
    this.selectedMetricUnit = obj;
  };  

  metricUnitsForMetric(metric): any {
      return this.metricUnits[metric];
  }

  onScalePrecisionChanged(event): void {
    this.selectedScalePrecision = this.precisionOptions.find(item=>item.value === event.value);
  }

  onCloseClick(): void {
    this.currentScale = this.activeScale; 
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
    this.annotationToolsService.setSnapState(true);
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

  cancelCalibrate(): void {
    let snap = RXCore.getSnapState();
    RXCore.calibrate(false);
    
    this.isSelectedCalibrate = false;
    this.isCalibrateFinished = false;

    this.calibrateLength = "0";
    this.currentScale = `1 Millimeter : 1 Millimeter`;
    
    if(snap === false) {
      RXCore.changeSnapState(false);
    }
  }

  onScaleChanged(event): void {
    this.selectedScale = this.scalesOptions.find(item=>item.value === event.value);
    this.applyScale(this.selectedScale);
  }

  updateMetric(selectedMetric: string): void {
    switch (selectedMetric){
      case '0' :
        RXCore.setUnit(1);
        break;
      case '1' :
        RXCore.setUnit(2);
        break;
    } 
  };

  onScaleOrCalibrateChange(type: number): void {
    this.scaleOrCalibrate = type;    
  }

  selectMetricUnitForPage(event): void {
    let obj = this.metricUnitsOptionsForPage.find(item => item.value === event.value);
    this.selectedMetricUnitForPage = obj;
  };

  selectMetricUnitForDisplay(event): void {
    let obj = this.metricUnitsOptionsForDisplay.find(item => item.value === event.value);
    this.selectedMetricUnitForDisplay = obj;
    
    if(this.metricUnits[0]?.[obj.value] !== undefined) {
      this.selectedMetric = '0';
    } else {
      this.selectedMetric = '1';
    }
  };

  updateMetricUnit(selectedMetric, selectedMetricUnitForDisplay): void {    
    if (selectedMetric === METRIC.UNIT_TYPES.METRIC ) {          
        RXCore.metricUnit(selectedMetricUnitForDisplay.label);          
    } else if (selectedMetric === METRIC.UNIT_TYPES.IMPERIAL ) {          
        RXCore.imperialUnit(selectedMetricUnitForDisplay.label);
    }      
  };

  convertToMM(value: string): number {
    let unitScale = 1;

    if (value === 'Centimeter') {
      unitScale = 10;
    } 
    else if (value === 'Decimeter') {
        unitScale = 100;
    } 
    else if (value === 'Meter') {
        unitScale = 1000;
    } 
    else if (value === 'Kilometer') {
        unitScale = 1000000;
    } 
    else if (value === 'Nautical Miles') {
        unitScale = 185200000;
    } 
    else if (value === 'Inch') {
      unitScale = 25.4;
    }

    return unitScale;
  }

  convertToInch(value: string): number {
    let unitScale = 1;

    if (value === 'Feet') {
        unitScale = 12;
    } 
    else if (value === 'Yard') {
        unitScale = 36;
    } 
    else if (value === 'Mile') {
        unitScale = 63360;
    } 
    else if (value === 'Nautical Miles') {
        unitScale = 72913.3858;
    } 
    else if (value === 'Millimeter') {
      unitScale = 0.0393701;
    } 
    else if (value === 'Centimeter') {
      unitScale = 0.393701;
    } 

    return unitScale;
  }

  calculateScale() {
    let scale = '1:1';    
    let selectedMetricForPage = '1';
    if(this.metricUnits[0]?.[this.selectedMetricUnitForPage.value] !== undefined) {
      selectedMetricForPage = '0';
    }

    let unitScaleForPage;
    let unitScaleForDisplay;

    if(selectedMetricForPage === this.selectedMetric) {      
      if(this.selectedMetric === '0') {
        unitScaleForPage = this.convertToMM(this.selectedMetricUnitForPage.label);
        unitScaleForDisplay = this.convertToMM(this.selectedMetricUnitForDisplay.label);
      } else {
        unitScaleForPage = this.convertToInch(this.selectedMetricUnitForPage.label);
        unitScaleForDisplay = this.convertToInch(this.selectedMetricUnitForDisplay.label);
      }
    } 
    else if(selectedMetricForPage === '0' && this.selectedMetric === '1') {
      unitScaleForPage = this.convertToInch(this.selectedMetricUnitForPage.label);
      unitScaleForDisplay = this.convertToInch(this.selectedMetricUnitForDisplay.label);
    } 
    else if(selectedMetricForPage === '1' && this.selectedMetric === '0') {      
      unitScaleForPage = this.convertToMM(this.selectedMetricUnitForPage.label);
      unitScaleForDisplay = this.convertToMM(this.selectedMetricUnitForDisplay.label);
    }

    const scaleForPage = this.customPageScaleValue * unitScaleForPage;
    const scaleForDisplay = this.customDisplayScaleValue * unitScaleForDisplay;
     
    scale = `${scaleForPage}:${scaleForDisplay}`;
    return scale;
  }
  
  applyScale(selectedScaleObj: any) {    
    this.updateMetric(selectedScaleObj.selectedMetric);
    this.updateMetricUnit(selectedScaleObj.selectedMetric, selectedScaleObj.selectedMetricUnitForDisplay);
    RXCore.setDimPrecisionForPage(this.countDecimals(this.selectedScalePrecision?.value));
    RXCore.scale(selectedScaleObj.value);

    this.currentScale = selectedScaleObj.label;
    this.service.setMeasureScaleState({visible: true, value: this.currentScale});

    if(this.isSelectedCalibrate) {      
      this.isSelectedCalibrate = false;
      this.isCalibrateFinished = false;
    }

    //this.showSuccess();
    //this.onCloseClick();
  }

  addNewScale() {    
    let scaleLabel = `${this.customPageScaleValue} ${this.selectedMetricUnitForPage.label} : ${this.customDisplayScaleValue} ${this.selectedMetricUnitForDisplay.label}`
    let scale = this.calculateScale();
    let obj = { 
      value: scale, 
      label: scaleLabel,
      selectedMetric: this.selectedMetric,
      selectedMetricUnitForDisplay: this.selectedMetricUnitForDisplay,
      dimPrecision: this.countDecimals(this.selectedScalePrecision?.value)
    };
    this.scalesOptions.push(obj);
    this.selectedScale = obj;
    this.applyScale(this.selectedScale);
    this.saveScaleToLocalStorage();
    this.currentScale = this.selectedScale.label;
    
    this.service.setMeasureScaleState({visible: true, value: this.currentScale});
    //this.showSuccess();
    // this.onCloseClick();
  }

  deleteScale(): void {
    this.scalesOptions = this.scalesOptions.filter(item=>item.value !== this.selectedScale.value);
    this.selectedScale = this.scalesOptions[0];
    this.saveScaleToLocalStorage();
    this.currentScale = this.selectedScale.label;
    this.service.setMeasureScaleState({visible: true, value: this.currentScale});
  }

  selectMetricUnitForCalibrate(event): void {
    let obj = this.metricUnitsOptions.find(item => item.value === event.value);
    this.selectedMetricUnit = obj;
    
    if(this.metricUnits[0]?.[obj.value] !== undefined) {
      this.selectedMetric = '0';
    } else {
      this.selectedMetric = '1';
    }
  }

  applyCalibrate() {
    this.updateMetric(this.selectedMetric);
    this.updateMetricUnit(this.selectedMetric, this.selectedMetricUnit);
    
    this.calibrateLength = this.calibrateLength.trim();
    var calibrateconn = RXCore.getCalibrateGUI();
    calibrateconn.SetTempCal(this.calibrateLength);
    calibrateconn.setCalibrateScaleByLength();

    if(!Number.isFinite(calibrateconn.getMeasureScale())) {
      return;
    }

    calibrateconn.setCalibration(true);

    RXCore.setDimPrecisionForPage(this.countDecimals(this.selectedScalePrecision?.value));
    
    RXCore.scale('Calibration');

    const measureScale = calibrateconn.getMeasureScale().toFixed(2);
    const scaleVaue = `1:${measureScale}`;
    const scaleLabel = `1 ${this.selectedMetricUnit.label} : ${measureScale} ${this.selectedMetricUnit.label}`;
    RXCore.calibrate(false);
    this.cancelCalibrate();
    this.scaleOrCalibrate = 0;
    RXCore.scale(scaleVaue);

    let obj = { 
      value: scaleVaue,
      label: scaleLabel,
      selectedMetric: '0',
      selectedMetricUnitForDisplay: this.selectedMetricUnit
    };
    this.scalesOptions.push(obj);
    this.selectedScale = obj;    
    this.saveScaleToLocalStorage();
    this.currentScale = this.selectedScale.label;
    
    this.service.setMeasureScaleState({visible: true, value: this.currentScale});

    //this.showSuccess();
    // this.onCloseClick();
  }

  saveScaleToLocalStorage(): void {
    const jsonString = JSON.stringify(this.scalesOptions);
    localStorage.setItem("scalesOptions", jsonString);
  }

  showSuccess() {
    this.toastr.success('Start measuring by selecting one of the measurement tools.', 'Scale has been successfully set', {      
      positionClass: 'toast-bottom-right',
      timeOut: 3000,
    });
  }
}
