import type Koa from "koa";
import { Project } from "scenario-tester";
import { createServer } from "../src/server";
import supertest from "supertest";
import QUnit from "qunit";
import { join } from "path";

// TODO: share this in core
export function templateOnlyComponentTemplate(template: string): string {
  return `import { setComponentTemplate } from '@ember/component';
  import { precompileTemplate } from '@ember/template-compilation';
  import templateOnlyComponent from '@ember/component/template-only';
  export default setComponentTemplate(
    precompileTemplate('${template}', {
      strictMode: true,
    }),
    templateOnlyComponent()
  );`;
}

QUnit.module("Card Data", function (hooks) {
  let realm: Project;
  let server: Koa;

  function getCard(cardURL: string) {
    return supertest(server.callback()).get(
      `/cards/${encodeURIComponent(cardURL)}`
    );
  }

  hooks.beforeEach(async function () {
    realm = new Project("my-realm", {
      files: {
        post: {
          "card.json": JSON.stringify({
            schema: "./schema.js",
            isolated: "./isolated.js",
          }),
          "schema.js": `
      import { contains } from "@cardstack/types";
      import string from "https://cardstack.com/base/string";
      export default class Post {
        @contains(string)
        title;
        @contains(string)
        body;
      }`,
          "isolated.js": templateOnlyComponentTemplate(
            "<h1><@model.title/></h1><article><@model.body/></article>"
          ),
        },

        post0: {
          "card.json": JSON.stringify({
            adoptsFrom: "../post",
            data: {
              title: "Hello World",
              body: "First post.",
            },
          }),
        },
      },
    });

    realm.writeSync();

    server = await createServer([
      { url: "https://my-realm", directory: realm.baseDir },
      {
        url: "https://cardstack.com/base",
        directory: join(__dirname, "..", "..", "base-cards"),
      },
    ]);
  });

  QUnit.test(
    "404s when you try to load a card outside of it's realm",
    async function (assert) {
      assert.expect(0);
      await getCard("https://some-other-origin/thing").expect(404);
    }
  );

  QUnit.test("can load a simple isolated card's data", async function (assert) {
    let response = await getCard("https://my-realm/post0").expect(200);
    assert.equal(response.body, {
      data: {
        attributes: {
          title: "Hello World",
          body: "First post.",
        },
        meta: {
          isolatedComponentModule:
            "@cardstack/compiled/my-realm/post0/isolated",
        },
      },
    });
  });
});