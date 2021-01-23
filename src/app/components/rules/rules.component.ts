import { Component, OnInit, OnChanges, SimpleChanges, Input, EventEmitter, Output } from '@angular/core';
import { Rule, Rules } from '../../model/interface';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss']
})
export class RulesComponent implements OnInit, OnChanges {

  rules: Rule[] = [
    {
      description: 'Ordinary piece can capture backwards',
      key: 'canPieceCaptureBackwards',
      yesNo: true
    },
    {
      description: 'King can move more than on step',
      key: 'canKingMoveMoreThanOneStep',
      yesNo: true
    },
    {
      description: 'Ordinary piece can capture backwards',
      key: 'shouldPieceContinueCapturingAfterFarthestRow',
      yesNo: true
    },
    {
      description: 'King can move more than on step',
      key: 'shouldCaptureWhenPossible',
      yesNo: true
    },
    {
      description: 'Ordinary piece can capture backwards',
      key: 'shouldCaptureMaxPossible',
      yesNo: true
    },
    {
      description: 'King can move more than on step',
      key: 'shouldDiscardCapturedPieceMomentarily',
      yesNo: true
    },
  ];

  @Input()
  isCreator = true;

  @Output() event = new EventEmitter<any>();
  
  constructor(
    private storageService: StorageService
  ) { }

  ngOnInit() {
    const rules = this.storageService.getRules();
    if (rules) {
      this.rules = rules;
    } else {
      this.storageService.saveRules(this.rules);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(this.isCreator);
  }

  ruleChanged(rule: Rule) {
    rule.yesNo = !rule.yesNo;
    this.storageService.saveRules(this.rules);
    this.event.emit(this.getRules());
  }

  getRules() {
    const rules = {};
    this.rules.forEach((rule) => {
      rules[rule.key] = rule.yesNo;
    });
    return rules;
  }

  updateRules(rules: any) {
    this.rules.forEach((rule) => {
      rule.yesNo = rules[rule.key];
    });
    this.storageService.saveRules(this.rules);
  }


}
