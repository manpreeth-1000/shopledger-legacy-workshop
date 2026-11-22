'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');
var reports = require('../lib/reports');

function makeOrder(item, coupon) {
  var totals = pricing.computeTotals([item], coupon || '');
  return {
    id: 42,
    date: '22/11/2026',
    customer: 'In-memory customer',
    status: 'completed',
    coupon: coupon || '',
    items: [item],
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total
  };
}

test('Invoice matches the billed HSN GST breakdown and total', function () {
  var item = { id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 640, qty: 1 };
  var order = makeOrder(item);
  var invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    { subtotal: order.subtotal, discount: order.discount, tax: order.tax, total: order.total },
    { subtotal: 640, discount: 0, tax: 32, total: 672 }
  );
  assert.deepEqual(
    { tax: invoiceFigures.tax, cgst: invoiceFigures.cgst, sgst: invoiceFigures.sgst, total: invoiceFigures.total },
    { tax: order.tax, cgst: 16, sgst: 16, total: order.total }
  );
  assert.deepEqual(
    { gstPercent: invoiceFigures.rows[0].gstPercent, lineTax: invoiceFigures.rows[0].lineTax },
    { gstPercent: 5, lineTax: 32 }
  );
});

test('Invoice applies SAVE10 before GST using the billed discount and tax', function () {
  var item = { id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 640, qty: 1 };
  var order = makeOrder(item, 'SAVE10');
  var invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    { discount: order.discount, tax: order.tax, total: order.total },
    { discount: 64, tax: 28.8, total: 604.8 }
  );
  assert.deepEqual(
    { discount: invoiceFigures.discount, tax: invoiceFigures.tax, total: invoiceFigures.total },
    { discount: order.discount, tax: order.tax, total: order.total }
  );
});

test('Invoice honors the SAVE10 maximum discount used for billing', function () {
  var item = { id: 2, name: 'Coffee', sku: 'COF-1', hsn: '0901', price: 5000, qty: 1 };
  var order = makeOrder(item, 'SAVE10');
  var invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(
    { discount: order.discount, tax: order.tax, total: order.total },
    { discount: 150, tax: 873, total: 5723 }
  );
  assert.deepEqual(
    { discount: invoiceFigures.discount, tax: invoiceFigures.tax, total: invoiceFigures.total },
    { discount: order.discount, tax: order.tax, total: order.total }
  );
});

test('GST reconciliation reports no variance when invoice follows billed figures', function () {
  var item = { id: 2, name: 'Coffee', sku: 'COF-1', hsn: '0901', price: 5000, qty: 1 };
  var order = makeOrder(item, 'SAVE10');
  var result = reports.getGstReconciliation({
    orders: [order],
    products: [],
    customers: []
  });

  assert.equal(result.totalChecked, 1);
  assert.equal(result.mismatchCount, 0);
  assert.equal(result.totalDelta, 0);
  assert.deepEqual(
    { ledgerTax: result.rows[0].ledgerTax, invoiceTax: result.rows[0].invoiceTax, delta: result.rows[0].delta, matched: result.rows[0].matched },
    { ledgerTax: 873, invoiceTax: 873, delta: 0, matched: true }
  );
});
