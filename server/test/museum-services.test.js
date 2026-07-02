import test from "node:test";
import assert from "node:assert/strict";
import { searchMet } from "../src/services/metService.js";
import { searchArtic } from "../src/services/articService.js";

const originalFetch = global.fetch;

test.afterEach(() => {
  global.fetch = originalFetch;
});

test("The Met adapter normalizes public-domain artwork records", async () => {
  global.fetch = async (url) => {
    const value = String(url);
    if (value.includes("/search?")) {
      return new Response(JSON.stringify({ total: 1, objectIDs: [101] }), { status: 200 });
    }
    return new Response(
      JSON.stringify({
        objectID: 101,
        title: "Test Landscape",
        artistDisplayName: "Example Artist",
        objectDate: "1888",
        objectBeginDate: 1888,
        objectEndDate: 1888,
        medium: "Oil on canvas",
        department: "European Paintings",
        primaryImage: "https://example.test/full.jpg",
        primaryImageSmall: "https://example.test/small.jpg",
        objectURL: "https://example.test/object/101",
        isPublicDomain: true,
        creditLine: "Example credit",
      }),
      { status: 200 }
    );
  };

  const result = await searchMet({ query: "landscape-test", page: 1, limit: 4, publicDomainOnly: true });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].source, "met");
  assert.equal(result.items[0].title, "Test Landscape");
  assert.equal(result.items[0].isPublicDomain, true);
});

test("The Art Institute adapter uses the public-domain query and builds IIIF URLs", async () => {
  let requestedUrl = "";
  global.fetch = async (url) => {
    requestedUrl = String(url);
    return new Response(
      JSON.stringify({
        pagination: { total: 1 },
        config: { iiif_url: "https://www.artic.edu/iiif/2" },
        data: [
          {
            id: 202,
            title: "Test Portrait",
            image_id: "image-key",
            artist_title: "Example Painter",
            date_display: "1901",
            medium_display: "Oil on panel",
            place_of_origin: "France",
            is_public_domain: true,
            credit_line: "Example gift",
          },
        ],
      }),
      { status: 200 }
    );
  };

  const result = await searchArtic({ query: "portrait-test", page: 1, limit: 4, publicDomainOnly: true });
  assert.match(requestedUrl, /query%5Bterm%5D%5Bis_public_domain%5D=true/);
  assert.equal(result.items[0].source, "artic");
  assert.equal(result.items[0].imageUrl, "https://www.artic.edu/iiif/2/image-key/full/1686,/0/default.jpg");
});
