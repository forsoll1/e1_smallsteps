import "./polyfills";
import express from "express";

// Refactor the following code to get rid of the legacy Date class.
// Use Temporal.PlainDate instead. See /test/date_conversion.spec.mjs for examples.

function createApp(database) {
  const app = express();

  app.put("/prices", (req, res) => {
    const type = req.query.type;
    const cost = parseInt(req.query.cost);
    database.setBasePrice(type, cost);
    res.json();
  });

  app.get("/prices", (req, res) => {
    const age = req.query.age ? parseInt(req.query.age) : undefined;
    const type = req.query.type;
    const baseCost = database.findBasePriceByType(type).cost;
    const date = parseDate(req.query.date);
    const date2 = parseDate2(req.query.date);
    const cost = calculateCost(age, type, date, date2, baseCost);
    res.json({ cost });
  });

  function parseDate(dateString) {
    if (dateString) {
      return new Date(dateString);
    }
  }
  function parseDate2(dateString) {
    if (dateString) {
      return Temporal.PlainDate.from(dateString)
    }
  }

  function calculateCost(age, type, date, date2, baseCost) {
    if (type === "night") {
      return calculateCostForNightTicket(age, baseCost);
    } else {
      return calculateCostForDayTicket(age, date, date2, baseCost);
    }
  }

  function calculateCostForNightTicket(age, baseCost) {
    if (age === undefined) {
      return 0;
    }
    if (age < 6) {
      return 0;
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.4);
    }
    return baseCost;
  }

  function calculateCostForDayTicket(age, date, date2, baseCost) {
    let reduction = calculateReduction(date, date2);
    if (age === undefined) {
      return Math.ceil(baseCost * (1 - reduction / 100));
    }
    if (age < 6) {
      return 0;
    }
    if (age < 15) {
      return Math.ceil(baseCost * 0.7);
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.75 * (1 - reduction / 100));
    }
    return Math.ceil(baseCost * (1 - reduction / 100));
  }

  function calculateReduction(date, date2) {
    let reduction = 0;
    if (date && isMonday(date, date2) && !isHoliday(date, date2)) {
      reduction = 35;
    }
    return reduction;
  }

  function isMonday(date, date2) {
    return date2.dayOfWeek === 1;
    /*return date.getDay() === 1;*/
  }

  function isHoliday(date, date2) {
    const holidays = database.getHolidays();
    for (let row of holidays) {
      let holiday = new Date(row.holiday);
      let holiday2 = Temporal.PlainDate.from(row.holiday)
      if (
        date &&
        date.getFullYear() === holiday.getFullYear() &&
        date.getMonth() === holiday.getMonth() &&
        date.getDate() === holiday.getDate()
        &&
        //Same checks for Temporal.PlainDate
        date2 &&
        date2.year === holiday2.year &&
        date2.month === holiday2.month &&
        date2.day === holiday2.day

      ) {
        return true;
      }
    }
    return false;
  }

  return app;
}

export { createApp };
