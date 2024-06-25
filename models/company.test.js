"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'new'`);
    expect(result.rows).toEqual([
      {
        handle: "new",
        name: "New",
        description: "New Description",
        num_employees: 1,
        logo_url: "http://new.img",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

beforeEach(async function () {
  // Seed the database with test data before each test
  await db.query("DELETE FROM companies");

  // Insert some test companies
  await Company.create({
    handle: "apple",
    name: "Apple Inc.",
    description: "Technology company",
    numEmployees: 100000,
    logoUrl: "https://example.com/apple-logo",
  });

  await Company.create({
    handle: "google",
    name: "Google LLC",
    description: "Search engine company",
    numEmployees: 150000,
    logoUrl: "https://example.com/google-logo",
  });
});

afterAll(async function () {
  // Close db connection after all tests
  await db.end();
});

describe("Company.findAll", function () {
  // Test case: findAll without any filters
  test("findAll: no filters", async function () {
    const companies = await Company.findAll({});
    expect(companies).toEqual([
      {
        handle: "apple",
        name: "Apple Inc.",
        description: "Technology company",
        numEmployees: 100000,
        logoUrl: "https://example.com/apple-logo",
      },
      {
        handle: "google",
        name: "Google LLC",
        description: "Search engine company",
        numEmployees: 150000,
        logoUrl: "https://example.com/google-logo",
      },
    ]);
  });

  // Test case: findAll filtering by company name
  test("findAll: filter by name", async function () {
    const companies = await Company.findAll({ name: "apple" });
    expect(companies).toEqual([
      {
        handle: "apple",
        name: "Apple Inc.",
        description: "Technology company",
        numEmployees: 100000,
        logoUrl: "https://example.com/apple-logo",
      },
    ]);
  });

  // Test case: findAll filtering by minimum number of employees
  test("findAll: filter by minEmployees", async function () {
    const companies = await Company.findAll({ minEmployees: 120000 });
    expect(companies).toEqual([
      {
        handle: "google",
        name: "Google LLC",
        description: "Search engine company",
        numEmployees: 150000,
        logoUrl: "https://example.com/google-logo",
      },
    ]);
  });

  // Test case: findAll filtering by maximum number of employees
  test("findAll: filter by maxEmployees", async function () {
    const companies = await Company.findAll({ maxEmployees: 120000 });
    expect(companies).toEqual([
      {
        handle: "apple",
        name: "Apple Inc.",
        description: "Technology company",
        numEmployees: 100000,
        logoUrl: "https://example.com/apple-logo",
      },
    ]);
  });

  // Test case: findAll filtering by both minEmployees and maxEmployees
  test("findAll: filter by minEmployees and maxEmployees", async function () {
    const companies = await Company.findAll({
      minEmployees: 100000,
      maxEmployees: 120000,
    });
    expect(companies).toEqual([
      {
        handle: "apple",
        name: "Apple Inc.",
        description: "Technology company",
        numEmployees: 100000,
        logoUrl: "https://example.com/apple-logo",
      },
    ]);
  });

  // Test case: findAll with invalid minEmployees greater than maxEmployees
  test("bad request if invalid min > max", async function () {
    try {
      await Company.findAll({ minEmployees: 10, maxEmployees: 1 });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let company = await Company.get("c1");
    expect(company).toEqual({
      handle: "c1",
      name: "C1",
      description: "Desc1",
      numEmployees: 1,
      logoUrl: "http://c1.img",
    });
  });

  test("not found if no such company", async function () {
    try {
      await Company.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Company.remove("c1");
    const res = await db.query(
        "SELECT handle FROM companies WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
