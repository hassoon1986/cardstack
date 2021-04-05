import { transformSync } from '@babel/core';
// @ts-ignore
import decoratorsPlugin from '@babel/plugin-proposal-decorators';
// @ts-ignore
import classPropertiesPlugin from '@babel/plugin-proposal-class-properties';

import cardSchemaPlugin, {
  FieldsMeta,
  getMeta,
} from './babel/card-schema-plugin';
import cardTemplatePlugin, {
  Options as CardTemplateOptions,
} from './babel/card-template-plugin';
import { CompiledCard, ComponentInfo, Format, RawCard } from './interfaces';

import intersection from 'lodash/intersection';

export class Compiler {
  lookup: (cardURL: string) => Promise<CompiledCard>;
  define: (fullModuleURL: string, source: string) => Promise<void>;

  constructor(params: {
    lookup: (url: string) => Promise<CompiledCard>;
    define: Compiler['define'];
  }) {
    this.lookup = params.lookup;
    this.define = params.define;
  }

  async compile(cardSource: RawCard): Promise<CompiledCard> {
    if (cardSource.url === compiledBaseCard.url) {
      return compiledBaseCard;
    }

    let options = {};
    let parentCard;

    let modelModuleName = this.prepareSchema(cardSource, options);
    let meta = getMeta(options);

    if (meta.parent) {
      parentCard = await this.lookup(meta.parent.cardURL);
    } else {
      // the base card from which all other cards derive
      parentCard = compiledBaseCard;
    }

    let fields = await this.lookupFieldsForCard(meta.fields);

    if (parentCard) {
      fields = this.adoptFields(fields, parentCard);
    }

    let card: CompiledCard = {
      url: cardSource.url,
      modelModule: modelModuleName ?? parentCard.modelModule,
      fields,
      data: cardSource.data,
      isolated: this.prepareComponent(
        cardSource,
        fields,
        parentCard,
        'isolated'
      ),
      embedded: this.prepareComponent(
        cardSource,
        fields,
        parentCard,
        'embedded'
      ),
    };
    if (parentCard) {
      card['adoptsFrom'] = parentCard;
    }
    return card;
  }

  /**
   * For the compiled module paths, we generate predictable urls based off
   * the provided cardUrl and module name. This will later be modified by
   * the builder to handle various contexts
   */
  getFullModulePath(cardURL: string, moduleName: string): string {
    return `${cardURL}/${moduleName}`;
  }

  // returns the module name of our own compiled schema, if we have one. Does
  // not recurse into parent, because we don't necessarily know our parent until
  // after we've tried to compile our own
  private prepareSchema(
    cardSource: RawCard,
    options: Object
  ): string | undefined {
    let localFile = cardSource.schema;
    if (!localFile) {
      return undefined;
    }
    let src = cardSource.files[localFile];
    if (!src) {
      throw new Error(
        `${cardSource.url} refers to ${localFile} in its card.json but that file does not exist`
      );
    }
    let out = transformSync(src, {
      plugins: [
        [cardSchemaPlugin, options],
        [decoratorsPlugin, { decoratorsBeforeExport: false }],
        classPropertiesPlugin,
      ],
    });

    let code = out!.code!;
    let fullModulePath = this.getFullModulePath(cardSource.url, localFile);
    this.define(fullModulePath, code);
    return fullModulePath;
  }

  async lookupFieldsForCard(
    metaFields: FieldsMeta
  ): Promise<CompiledCard['fields']> {
    let fields: CompiledCard['fields'] = {};
    for (let [name, { cardURL, type, localName }] of Object.entries(
      metaFields
    )) {
      fields[name] = {
        card: await this.lookup(cardURL),
        type,
        localName,
      };
    }

    return fields;
  }

  adoptFields(
    fields: CompiledCard['fields'],
    parentCard: CompiledCard
  ): CompiledCard['fields'] {
    let cardFieldNames = Object.keys(fields);
    let parentFieldNames = Object.keys(parentCard.fields);

    let fieldNameCollisions = intersection(cardFieldNames, parentFieldNames);

    if (fieldNameCollisions.length) {
      throw Error(
        `Field collision on ${fieldNameCollisions.join()} with parent card ${
          parentCard.url
        }`
      );
    }

    return Object.assign(fields, parentCard.fields);
  }

  prepareComponent(
    cardSource: RawCard,
    fields: CompiledCard['fields'],
    parentCard: CompiledCard,
    which: Format
  ): ComponentInfo {
    let localFile = cardSource[which];
    if (localFile) {
      if (!cardSource.files[localFile]) {
        throw new Error(
          `${cardSource.url} referred to ${localFile} in its card.json but that file does not exist`
        );
      }
      let moduleName = this.getFullModulePath(cardSource.url, localFile);
      return this.compileComponent(
        cardSource.files[localFile],
        fields,
        moduleName
      );
    } else {
      return parentCard[which];
    }
  }

  compileComponent(
    templateSource: string,
    fields: CompiledCard['fields'],
    moduleName: string
  ): ComponentInfo {
    let componentInfo: ComponentInfo = {
      moduleName,
    };
    let options: CardTemplateOptions = { fields, componentInfo };
    let out = transformSync(templateSource, {
      plugins: [[cardTemplatePlugin, options]],
    });
    this.define(moduleName, out!.code!);
    return componentInfo;
  }
}

// it's easier to hand-compile and hard-code the base card rather than make the
// card compiler always support the case of an undefined parentCard. This is the
// only card with no parentCard.
const compiledBaseCard = {
  url: 'https://cardstack.com/base/base',
  fields: {},
  data: undefined,
  modelModule: 'todo',
  isolated: {
    moduleName: 'todo',
  },
  embedded: {
    moduleName: 'todo',
  },
};