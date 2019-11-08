import Component from '@glimmer/component';
import { dasherize } from '@ember/string';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

const defaultSchemaAttrs = [
  'title',
  'type',
  'is-meta',
  'name',
  'embedded'
];

// These are the field attributes that will trigger onFieldChanged()
// to be called when the values of this attributes change
const onFieldChangedDependencies = [
  'nonce',
  'name',
  'label'
]

let renderNonce = 0;
export default class FieldRenderer extends Component {
  @tracked newFieldName;
  @tracked newFieldLabel;
  @tracked currentNonce;
  @tracked renderNonce;

  constructor(...args) {
    super(...args);

    this.newFieldName = this.args.field.name;
    this.newFieldLabel = this.args.field.label;
    this.currentNonce = this.nonce;
    this.renderNonce = renderNonce++;
  }

  get schemaAttrs() {
    return this.args.schemaAttrs || defaultSchemaAttrs;
  }

  get sanitizedType() {
    return this.args.field.type.replace(/::/g, '/').replace(/@/g, '');
  }

  get onFieldUpdated() {
    if (this.nonce !== this.currentNonce) {
      this.currentNonce = this.nonce;
      this.newFieldName = this.args.field.name;
      this.newFieldLabel = this.args.field.label;
    }
    return null;
  }

  get nonce() {
    return onFieldChangedDependencies.map(i => this.args.field[i]).join('::');
  }

  get dasherizedType() {
    return dasherize(this.sanitizedType.replace(/\//g, '-'));
  }

  get fieldViewer() {
    return `fields/${dasherize(this.sanitizedType)}-viewer`;
  }

  get fieldEditor() {
    return `fields/${dasherize(this.sanitizedType)}-editor`;
  }

  @action
  updateFieldName(newName) {
    this.newFieldName = newName;
    this.args.setFieldName(this.args.field.name, this.newFieldName);
  }

  @action
  updateFieldLabel(newLabel) {
    this.newFieldLabel = newLabel;
    this.args.setFieldLabel(this.args.field.name, this.newFieldLabel);
  }

  @action
  selectField(field) {
    if (this.args.selectField) {
      this.args.selectField(field);
    }
  }
}