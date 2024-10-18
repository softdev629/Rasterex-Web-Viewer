import { Component, HostListener, OnInit } from '@angular/core';
import { AnnotationToolsService } from '../annotation-tools.service';
import { RXCore } from 'src/rxcore';
import { IMarkup } from 'src/rxcore/models/IMarkup';
import { MARKUP_TYPES } from 'src/rxcore/constants';
import { RxCoreService } from 'src/app/services/rxcore.service';
import dayjs, { Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { Subscription } from 'rxjs';

declare var LeaderLine: any;

@Component({
  selector: 'rx-note-panel',
  templateUrl: './note-panel.component.html',
  styleUrls: ['./note-panel.component.scss'],
  host: {
    '(window:resize)': 'onWindowResize($event)',
  },
})
export class NotePanelComponent implements OnInit {
  visible: boolean = false;

  list: { [key: string]: Array<IMarkup> };
  annotList: { [key: string]: Array<any> };
  search: string;
  panelwidth: number = 300;

  /*added for comment list panel */
  note: any[] = [];
  connectorLine: any;
  lineConnectorNativElement: any = document.getElementById('lineConnector');
  activeMarkupNumber: number = -1;
  markupNoteList: number[] = [];
  noteIndex: number;
  pageNumber: number = -1;
  isHideAnnotation: boolean = false;
  pageNumbers: any[] = [];
  sortByField: 'created' | 'position' | 'author' | 'pagenumber' | 'annotation' =
    'created';

  sortOptions = [
    { value: 'created', label: 'Created day' },
    { value: 'author', label: 'Author' },
    { value: 'pagenumber', label: 'Page' },
    { value: 'position', label: 'Position' },
    { value: 'annotation', label: 'Annotation Type' },
  ];

  /*added for comment list panel */

  sortOrder = (a, b): number => 0;
  filterVisible: boolean = false;
  createdByFilterOptions: Array<any> = [];
  createdByFilter: Set<string> = new Set<string>();
  dateFilter: {
    startDate: dayjs.Dayjs | undefined;
    endDate: dayjs.Dayjs | undefined;
  } = { startDate: undefined, endDate: undefined };

  /*added for comment list panel */
  private guiOnPanUpdatedSubscription: Subscription;
  /*added for comment list panel */

  leaderLine: any = undefined;
  rectangle: any;

  visibleStatusMenuIndex: number | null = null;
  statusTypes = [
    { value: 'accepted', text: 'Accepted' },
    { value: 'rejected', text: 'Rejected' },
    { value: 'cancelled', text: 'Cancelled' },
    { value: 'completed', text: 'Completed' },
    { value: 'none', text: 'None' },
    { value: 'marked', text: 'Marked' },
    { value: 'unmarked', text: 'Unmarked' },
  ];
  objectType: string | null = null;

  constructor(
    private readonly rxCoreService: RxCoreService,
    private readonly annotationToolsService: AnnotationToolsService
  ) {
    dayjs.extend(relativeTime);
    dayjs.extend(updateLocale);
    dayjs.extend(isSameOrAfter);
    dayjs.extend(isSameOrBefore);
    dayjs.updateLocale('en', {
      relativeTime: {
        past: '%s',
        s: 'A few seconds ago',
        m: 'A minute ago',
        mm: function (number) {
          return number > 10 ? `${number} minutes ago` : 'A few minutes ago';
        },
        h: 'An hour ago',
        hh: 'Today',
        d: 'Yesterday',
        dd: function (number) {
          return number > 1 ? `${number} days ago` : 'Yesterday';
        },
        M: 'A month ago',
        MM: '%d months ago',
        y: 'A year ago',
        yy: '%d years ago',
      },
    });
  }

  private _showLeaderLine(markup: IMarkup): void {
    this._hideLeaderLine();

    const start = document.getElementById(`note-panel-${markup.markupnumber}`);
    if (!start) return;

    const end = document.createElement('div');
    end.style.position = 'fixed';
    end.style.left = `${markup.xscaled + 92}px`;
    end.style.top = `${markup.yscaled + 58}px`;
    end.className = 'leader-line-end';
    document.body.appendChild(end);

    this.leaderLine = new LeaderLine({
      start,
      end,
      color: document.documentElement.style.getPropertyValue('--accent'),
      size: 2,
      path: 'grid',
      endPlug: 'arrow2',
      endPlugSize: 1.5,
    });
  }

  private _hideLeaderLine(): void {
    if (this.leaderLine) {
      this.leaderLine.remove();
      this.leaderLine = undefined;
    }
    document
      .querySelectorAll('.leader-line-end,.leader-line')
      .forEach((el) => el.remove());
  }

  private _processList(list: Array<IMarkup> = []): void {
    /*modified for comment list panel */
    const query = list
      .filter((i: any) => {
        if (this.objectType === 'measure') {
          return (
            i.type === MARKUP_TYPES.MEASURE.LENGTH.type ||
            (i.type === MARKUP_TYPES.MEASURE.AREA.type &&
              i.subtype === MARKUP_TYPES.MEASURE.AREA.subType) ||
            (i.type === MARKUP_TYPES.MEASURE.PATH.type &&
              i.subtype === MARKUP_TYPES.MEASURE.PATH.subType) ||
            (i.type === MARKUP_TYPES.MEASURE.RECTANGLE.type &&
              i.subtype === MARKUP_TYPES.MEASURE.RECTANGLE.subType)
          );
        } else {
          return !(
            i.type === MARKUP_TYPES.MEASURE.LENGTH.type ||
            (i.type === MARKUP_TYPES.MEASURE.AREA.type &&
              i.subtype === MARKUP_TYPES.MEASURE.AREA.subType) ||
            (i.type === MARKUP_TYPES.MEASURE.PATH.type &&
              i.subtype === MARKUP_TYPES.MEASURE.PATH.subType) ||
            (i.type === MARKUP_TYPES.MEASURE.RECTANGLE.type &&
              i.subtype === MARKUP_TYPES.MEASURE.RECTANGLE.subType)
          );
        }
      })
      .filter((i: any) => {
        if (this.search) {
          if (this.connectorLine) this.connectorLine.hide();
          let searchQuery = this.search.toLocaleLowerCase();
          let comments: any = i.comments.map((i: any) => {
            return i.value.toLocaleLowerCase();
          });

          if (this.pageNumber > 0) {
            if (
              comments.find((x: string) => x.indexOf(searchQuery) > -1) ||
              i.author.toLocaleLowerCase().includes(searchQuery) ||
              i.getMarkupType().label.toLocaleLowerCase().includes(searchQuery)
            ) {
              return (
                (this.dateFilter.startDate
                  ? dayjs(i.timestamp).isSameOrAfter(this.dateFilter.startDate)
                  : true) &&
                (this.dateFilter.endDate
                  ? dayjs(i.timestamp).isSameOrBefore(
                      this.dateFilter.endDate.endOf('day')
                    )
                  : true) &&
                !i.bisTextArrow &&
                i.pagenumber === this.pageNumber - 1
              );
            }
          } else {
            if (
              comments.find((x: string) => x.indexOf(searchQuery) > -1) ||
              i.author.toLocaleLowerCase().includes(searchQuery) ||
              i.getMarkupType().label.toLocaleLowerCase().includes(searchQuery)
            ) {
              return (
                (this.dateFilter.startDate
                  ? dayjs(i.timestamp).isSameOrAfter(this.dateFilter.startDate)
                  : true) &&
                (this.dateFilter.endDate
                  ? dayjs(i.timestamp).isSameOrBefore(
                      this.dateFilter.endDate.endOf('day')
                    )
                  : true) &&
                !i.bisTextArrow
              );
            }
          }
          return;
        } else {
          if (this.pageNumber > 0) {
            return (
              (this.dateFilter.startDate
                ? dayjs(i.timestamp).isSameOrAfter(this.dateFilter.startDate)
                : true) &&
              (this.dateFilter.endDate
                ? dayjs(i.timestamp).isSameOrBefore(
                    this.dateFilter.endDate.endOf('day')
                  )
                : true) &&
              !i.bisTextArrow &&
              i.pagenumber === this.pageNumber - 1
            );
          } else {
            return (
              (this.dateFilter.startDate
                ? dayjs(i.timestamp).isSameOrAfter(this.dateFilter.startDate)
                : true) &&
              (this.dateFilter.endDate
                ? dayjs(i.timestamp).isSameOrBefore(
                    this.dateFilter.endDate.endOf('day')
                  )
                : true) &&
              !i.bisTextArrow
            );
          }
        }
      })
      .map((item: any) => {
        item.author = RXCore.getDisplayName(item.signature);
        item.createdStr = dayjs(item.timestamp).format(
          `MMM D,${
            dayjs().year() != dayjs(item.timestamp).year() ? 'YYYY ' : ''
          } h:mm A`
        );
        item.IsExpanded = item?.IsExpanded;
        item;
        return item;
      })
      .sort((a, b) => {
        switch (this.sortByField) {
          case 'created':
            return b.timestamp - a.timestamp;
          case 'author':
            return a.author.localeCompare(b.author);
          case 'position':
            return a.pagenumber === b.pagenumber
              ? a.y === b.y
                ? a.x - b.x
                : a.y - b.y
              : a.pagenumber - b.pagenumber;
          case 'pagenumber':
            return a.pagenumber - b.pagenumber;
          case 'annotation':
            return a
              .getMarkupType()
              .label.localeCompare(b.getMarkupType().label);
        }
      });

    switch (this.sortByField) {
      case 'created':
        this.list = query.reduce((list, item) => {
          const date = dayjs(item.timestamp).fromNow();
          if (!list[date]) {
            list[date] = [item];
          } else {
            list[date].push(item);
          }
          return list;
        }, {});
        break;
      case 'author':
        this.list = query.reduce((list, item) => {
          if (!list[item.author]) {
            list[item.author] = [item];
          } else {
            list[item.author].push(item);
          }

          return list;
        }, {});
        break;
      case 'annotation':
        this.list = query.reduce((list, item) => {
          const annotationLabel = item.getMarkupType().label;
          if (!list[annotationLabel]) {
            list[annotationLabel] = [item];
          } else {
            list[annotationLabel].push(item);
          }
          return list;
        }, {});
        break;
      case 'pagenumber':
        this.list = query.reduce((list, item) => {
          if (!list[`Page ${item.pagenumber + 1}`]) {
            list[`Page ${item.pagenumber + 1}`] = [item];
          } else {
            list[`Page ${item.pagenumber + 1}`].push(item);
          }
          return list;
        }, {});
        break;

      case 'position':
        this.list = query.reduce((list, item) => {
          if (!list[`Page ${item.pagenumber + 1}`]) {
            list[`Page ${item.pagenumber + 1}`] = [item];
          } else {
            list[`Page ${item.pagenumber + 1}`].push(item);
          }

          return list;
        }, {});

        break;

      default:
        this.list = { '': query };
    }
  }

  ngOnInit(): void {
    this.annotationToolsService.notePanelState$.subscribe((state) => {
      this.activeMarkupNumber = state?.markupnumber;
      if (this.activeMarkupNumber) {
        this.markupNoteList.push(this.activeMarkupNumber);
        this.markupNoteList = [...new Set(this.markupNoteList)];
        let markupList = this.rxCoreService.getGuiMarkupList();
        
        this._processList(markupList);
        if (Object.values(this.list).length > 0) {
          setTimeout(() => {
            markupList.filter((i: any) => {
              if (i.markupnumber === this.activeMarkupNumber) {
                let page = i.pagenumber + 1;
                this.pageNumbers = [];
                this.pageNumbers.push({ value: -1, label: 'Select' });
                for (let itm = 1; page >= itm; itm++) {
                  this.pageNumbers.push({ value: itm, label: itm });
                }

                this.onSelectAnnotation(i);
                this._setPosition(i);
              }
            });
          }, 200);
        }
      }
      /*added for comment list panel */

      this.visible = state?.visible;
      if (this.visible) {
        RXCore.setLayout(this.panelwidth, 0, false);
        RXCore.doResize(
          false,
          this.panelwidth,
          0
        ); /*added for comment list panel */
      } else {
        RXCore.setLayout(0, 0, false);
        RXCore.doResize(false, 0, 0); /*added for comment list panel */
      }

      if (state?.objectType !== this.objectType) {
        this.objectType = state?.objectType;
        this._processList(this.rxCoreService.getGuiMarkupList());
      }

      this._hideLeaderLine();
    });

    this.rxCoreService.guiMarkupList$.subscribe((list = []) => {
      this.createdByFilter = new Set();
      if (this.activeMarkupNumber > 0) {
        this.createdByFilterOptions = Object.values(
          list
            .filter((i: any) => i.text.length > 0)
            .reduce((options, item: any) => {
              if (!options[item.signature]) {
                options[item.signature] = {
                  value: item.signature,
                  label: RXCore.getDisplayName(item.signature),
                  selected: true,
                };
                this.createdByFilter.add(item.signature);
              }
              return options;
            }, {})
        );

        if (list.length > 0) {
          setTimeout(() => {
            list.filter((itm: any) => {
              if (itm.markupnumber === this.activeMarkupNumber) {
                this.pageNumbers = [];
                this.pageNumbers.push({ value: -1, label: 'Select' });
                let page = itm.pagenumber + 1;
                for (let i = 1; page >= i; i++) {
                  this.pageNumbers.push({ value: i, label: i });
                }
              }
            });
          }, 400);
        } else {
          this._processList(list);
        }
      }
      if (list.length > 0 && !this.isHideAnnotation) {
        setTimeout(() => {
          if (list.find((itm) => itm.getselected()) === undefined)
            this.activeMarkupNumber = -1;

          this._processList(list);
        }, 250);
      } else {
        this._processList(list);
      }
    });

    this.rxCoreService.guiAnnotList$.subscribe((list = []) => {
      this.annotList = { 'FoxitAnnots': list };
      console.log(this.annotList);
    })

    this.rxCoreService.guiPage$.subscribe((state) => {
      if (this.connectorLine) {
        this.annotationToolsService.hideQuickActionsMenu();
        this.connectorLine.hide();
        this._hideLeaderLine();
      }
    });

    this.rxCoreService.guiMarkupIndex$.subscribe(({ markup, operation }) => {
      this._hideLeaderLine();

      if (operation.modified || operation.created) {
        this.SetActiveCommentSelect(markup);
      }

      if (operation.created) {
        this.addTextNote(markup);
      }
    });

    this.rxCoreService.guiMarkup$.subscribe(({ markup, operation }) => {
      this._hideLeaderLine();

      if (operation.modified || operation.created) {
        this.SetActiveCommentSelect(markup);
      }

      if (operation.created) {
        this.addTextNote(markup);
      }
    });

    this.guiOnPanUpdatedSubscription =
      this.rxCoreService.guiOnPanUpdated$.subscribe(({ sx, sy, pagerect }) => {
        if (this.connectorLine) {
          this.annotationToolsService.hideQuickActionsMenu();
          this.connectorLine.hide();
          this._hideLeaderLine();
        }
      });

    this.guiOnPanUpdatedSubscription =
      this.rxCoreService.resetLeaderLine$.subscribe((response: boolean) => {
        if (this.connectorLine) {
          this.annotationToolsService.hideQuickActionsMenu();
          this.connectorLine.hide();
          this._hideLeaderLine();
        }
      });

    this.rxCoreService.guiOnMarkupChanged.subscribe(
      ({ annotation, operation }) => {
        this._hideLeaderLine();
      }
    );
  }

  get isEmpytyList(): boolean {
    return (
      Object.keys(this.list || {}).length == 0 || this.list['']?.length == 0
    );
  }

  get isFilterActive(): boolean {
    return (
      this.filterVisible == true ||
      this.createdByFilterOptions.length != this.createdByFilter.size ||
      this.dateFilter.startDate != undefined ||
      this.dateFilter.endDate != undefined
    );
  }

  onNoteClick(markup: IMarkup): void {
    RXCore.selectMarkUpByIndex(markup.markupnumber);
    this.rxCoreService.setGuiMarkupIndex(markup, {});
  }

  onSearch(event): void {
    this._processList(this.rxCoreService.getGuiMarkupList());
  }

  onSortFieldChanged(event): void {
    this.sortByField = event.value;
    this._processList(this.rxCoreService.getGuiMarkupList());
  }

  onCreatedByFilterChange(values): void {
    this.createdByFilter = new Set(values);
  }

  onDateSelect(dateRange: {
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;
  }): void {
    this.dateFilter = dateRange;
  }

  onPageChange(event): void {
    this.pageNumber = event.value;
    this._processList(this.rxCoreService.getGuiMarkupList());
  }

  onFilterApply(): void {
    this._processList(this.rxCoreService.getGuiMarkupList());
    this.filterVisible = false;
  }

  onClose(): void {
    this.visible = false;
    this._hideLeaderLine();
    RXCore.setLayout(0, 0, false);
    RXCore.doResize(false, 0, 0); /*added for comment list panel */
    this.rxCoreService.setCommentSelected(false);
  }

  onWindowResize(event): void {
    this._hideLeaderLine();
  }

  addTextNote(markup: any): void {
    if (markup.type == 9 || markup.type == 10) {
      this.note[markup.markupnumber] = markup.text;
    }
  }

  onAddNote(markup: any): void {
    if (this.note[markup.markupnumber]) {
      if (this.noteIndex >= 0) {
        markup.editComment(this.noteIndex, this.note[markup.markupnumber]);
        this.noteIndex = -1;
      } else {
        markup.AddComment(
          markup.comments.length,
          markup.signature,
          this.note[markup.markupnumber]
        );
      }

      this.note[markup.markupnumber] = '';
    } else return;
  }

  GetCommentLength(): number {
    let noOfComments = 0;

    Object.values(this.list || {}).forEach((comment) => {
      noOfComments += comment.length;
    });
    return noOfComments;
  }

  OnEditComment(event, markupNo: any, itemNote: any): void {
    event.stopPropagation();

    this.noteIndex = itemNote.id;
    this.note[markupNo] = itemNote.value;
  }

  OnRemoveComment(event, markup: any, id: number, index: number): void {
    event.stopPropagation();

    markup.deleteComment(id);
    if (markup.comments.length === 0) {
      if (this.connectorLine) this.connectorLine.hide();
      this.markupNoteList = this.markupNoteList.filter((item) => {
        return item !== markup.markupnumber;
      });
      this._processList(this.rxCoreService.getGuiMarkupList());
    }
    if (index === 0) {
      markup.comments = [];

      markup.deleteComment(id);
    }
  }

  DrawConnectorLine(startElem, endElem) {
    if (startElem !== null && endElem !== null) {
      if (this.connectorLine) this.connectorLine.hide();
      this.connectorLine = new LeaderLine(startElem, endElem, {
        startPlug: 'square',
        endPlug: 'square',
        endPlugOutline: false,
        size: 2.5,
        color: '#14ab0a',
        path: 'grid',
        startSocketGravity: 0,
        animOptions: { duration: 300, timing: 'linear' },
      });
    }
  }

  SetActiveCommentSelect(markup: any) {
    if (markup.bisTextArrow && markup.textBoxConnected != null) {
      markup = markup.textBoxConnected;
    }

    let markupNo = markup.markupnumber;

    if (markupNo) {
      this.activeMarkupNumber = markupNo;
      //this.onSelectAnnotation(markup);
      this._setPosition(markup);
    }
  }

  ItemNoteClick(event, markupNo: number, markup: any): void {
    console.log(markupNo);
  }

  SetActiveCommentThread(event, markupNo: number, markup: any): void {
    if (markupNo) {
      this.activeMarkupNumber = markupNo;
      this.onSelectAnnotation(markup);

      setTimeout(() => {
        this._setPosition(markup);
      }, 100);

      Object.values(this.list || {}).forEach((comments) => {
        comments.forEach((comment: any) => {
          if (comment.markupnumber === markupNo) {
            comment.IsExpanded = !comment.IsExpanded;
          }
        });
      });
    }
    event.preventDefault();
  }

  trackByFn(index, item) {
    return item.id;
  }

  ngOnDestroy(): void {
    this.guiOnPanUpdatedSubscription.unsubscribe();
  }

  onSelectAnnotation(markup: any): void {
    RXCore.selectMarkUpByIndex(markup.markupnumber);
    this.rxCoreService.setGuiMarkupIndex(markup, {});
  }

  private _setPosition(markup: any): void {
    if (markup.bisTextArrow && markup.textBoxConnected != null) {
      markup = markup.textBoxConnected;
    }

    if (markup.type !== MARKUP_TYPES.COUNT.type) {
      const wscaled = (markup.wscaled || markup.w) / window.devicePixelRatio;
      const hscaled = (markup.hscaled || markup.h) / window.devicePixelRatio;
      const xscaled = (markup.xscaled || markup.x) / window.devicePixelRatio;
      const yscaled = (markup.yscaled || markup.y) / window.devicePixelRatio;
      let rely = yscaled + hscaled * 0.5;
      let absy = yscaled + (hscaled - yscaled) * 0.5;

      let sidepointabs = {
        x: wscaled,
        y: absy,
      };

      let sidepointrel = {
        x: xscaled + wscaled,
        y: rely,
      };

      let _dx = window == top ? 0 : -82;
      let _dy = window == top ? 0 : -48;

      let dx = 0 + _dx;
      let dy = -10 + _dy;

      switch (markup.type) {
        case MARKUP_TYPES.ERASE.type:
        case MARKUP_TYPES.SHAPE.POLYGON.type:
        case MARKUP_TYPES.PAINT.POLYLINE.type:
        case MARKUP_TYPES.MEASURE.PATH.type:
        case MARKUP_TYPES.MEASURE.AREA.type: {
          let p = markup.points[0];
          for (let point of markup.points) {
            if (point.y < p.y) {
              p = point;
            }
          }
          this.rectangle = {
            x: sidepointabs.x,
            y: sidepointabs.y,
            x_1: wscaled - 20,
            y_1: yscaled - 20,
          };
          break;
        }
        case MARKUP_TYPES.NOTE.type:
          dx = wscaled / 2 - 5 + _dx;
          dy = -10 + _dy;
          this.rectangle = {
            x: sidepointrel.x,
            y: sidepointrel.y,
            x_1: xscaled + wscaled - 20,
            y_1: yscaled - 20,
          };
          break;
        case MARKUP_TYPES.ARROW.type:
          dx = -26 + _dx;
          this.rectangle = {
            x: xscaled + dx,
            y: yscaled + dy,
            x_1: xscaled + wscaled - 20,
            y_1: yscaled - 20,
          };
          break;
        case MARKUP_TYPES.MEASURE.LENGTH.type:
          this.rectangle = {
            x: xscaled - 5,
            y: yscaled - 5,
            x_1: xscaled + wscaled - 20,
            y_1: yscaled - 20,
          };
          break;
        default:
          dx = wscaled / 2 - 24 + _dx;
          this.rectangle = {
            /* bugfix 2 */
            x: xscaled + dx + wscaled / 2 + 20,
            y: yscaled + dy + hscaled / 2 + 10,
            //x: xscaled + dx,
            //y: yscaled + dy,
            /* bugfix 2 */
            x_1: xscaled + wscaled - 20,
            y_1: yscaled - 20,
          };
          break;
      }

      if (this.rectangle.y < 0) {
        this.rectangle.y += hscaled + 72;
        this.rectangle.position = 'bottom';
      } else {
        this.rectangle.position = 'top';
      }

      if (this.rectangle.x < 0) {
        this.rectangle.x = 0;
      }

      if (this.rectangle.x > document.body.offsetWidth - 200) {
        this.rectangle.x = document.body.offsetWidth - 200;
      }

      this.lineConnectorNativElement.style.top = this.rectangle.y + 'px';
      this.lineConnectorNativElement.style.left = this.rectangle.x + 'px';

      this.lineConnectorNativElement.style.position = this.rectangle.position;

      const lineConnectorEnd = document.getElementById(
        'note-panel-' + this.activeMarkupNumber
      );
      if (lineConnectorEnd && this.lineConnectorNativElement)
        this.DrawConnectorLine(
          document.getElementById('note-panel-' + this.activeMarkupNumber),
          this.lineConnectorNativElement
        );
    }
  }

  onHideComment(event: any, markupNo: number): void {
    this.isHideAnnotation = true;
    event.preventDefault();
    Object.values(this.list || {}).forEach((comments) => {
      comments.forEach((comment: any) => {
        if (comment.markupnumber === markupNo) {
          comment.IsExpanded = false;
        }
      });
    });
    if (this.connectorLine) {
      RXCore.unSelectAllMarkup();
      this.annotationToolsService.hideQuickActionsMenu();
      this.connectorLine.hide();
      this._hideLeaderLine();
    }
    event.stopPropagation();
  }

  @HostListener('scroll', ['$event'])
  scrollHandler(event) {
    if (event.type == 'scroll') {
      event.preventDefault();
      if (this.connectorLine) {
        //RXCore.unSelectAllMarkup();
        this.annotationToolsService.hideQuickActionsMenu();
        this.connectorLine.hide();
        this._hideLeaderLine();
        event.stopPropagation();
      }
    }
  }

  toogleStatusMenu(index: number) {
    if (this.visibleStatusMenuIndex === index) {
      this.visibleStatusMenuIndex = null;
    } else {
      this.visibleStatusMenuIndex = index;
    }
    event?.stopPropagation();
  }

  closeStatusMenu() {
    this.visibleStatusMenuIndex = null;
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const menus = document.querySelectorAll('.statusMenu');
    const buttons = document.querySelectorAll('.statusMenuButton');

    let isClickInsideMenu = Array.from(menus).some((menu) =>
      menu.contains(event.target as Node)
    );
    let isClickInsideButton = Array.from(buttons).some((button) =>
      button.contains(event.target as Node)
    );

    if (!isClickInsideMenu && !isClickInsideButton) {
      this.closeStatusMenu();
    }
  }

  onSetStatus(markup: any, statusValue: string) {
    markup.status = statusValue;
    this.closeStatusMenu();
    event?.stopPropagation();
  }
}
