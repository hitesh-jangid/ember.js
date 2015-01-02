import EmberView from "ember-views/views/view";
import run from "ember-metal/run_loop";
import EmberObject from "ember-runtime/system/object";
import compile from "ember-template-compiler/system/compile";
import { equalInnerHTML } from "htmlbars-test-helpers";
import { defaultEnv } from "ember-htmlbars";
import { runAppend, runDestroy } from "ember-runtime/tests/utils";

var view, originalSetAttribute, setAttributeCalls;
var dom = defaultEnv.dom;

if (Ember.FEATURES.isEnabled('ember-htmlbars-attribute-syntax')) {

  QUnit.module("ember-htmlbars: data attribute", {
    teardown: function() {
      runDestroy(view);
    }
  });

  test("property is output", function() {
    view = EmberView.create({
      context: { name: 'erik' },
      template: compile("<div data-name={{name}}>Hi!</div>")
    });
    runAppend(view);

    equalInnerHTML(view.element, '<div data-name="erik">Hi!</div>', "attribute is output");
  });

  test("property set before didInsertElement", function() {
    var matchingElement;
    view = EmberView.create({
      didInsertElement: function() {
        matchingElement = this.$('div[data-name=erik]');
      },
      context: { name: 'erik' },
      template: compile("<div data-name={{name}}>Hi!</div>")
    });
    runAppend(view);

    equalInnerHTML(view.element, '<div data-name="erik">Hi!</div>', "attribute is output");
    equal(matchingElement.length, 1, 'element is in the DOM when didInsertElement');
  });

  test("quoted attributes are concatenated", function() {
    view = EmberView.create({
      context: { firstName: 'max', lastName: 'jackson' },
      template: compile("<div data-name='{{firstName}} {{lastName}}'>Hi!</div>")
    });
    runAppend(view);

    equalInnerHTML(view.element, '<div data-name="max jackson">Hi!</div>', "attribute is output");
  });

  test("quoted attributes are updated when changed", function() {
    view = EmberView.create({
      context: { firstName: 'max', lastName: 'jackson' },
      template: compile("<div data-name='{{firstName}} {{lastName}}'>Hi!</div>")
    });
    runAppend(view);

    equalInnerHTML(view.element, '<div data-name="max jackson">Hi!</div>', "precond - attribute is output");

    run(view, view.set, 'context.firstName', 'james');

    equalInnerHTML(view.element, '<div data-name="james jackson">Hi!</div>', "attribute is output");
  });

  test("quoted attributes are not removed when value is null", function() {
    view = EmberView.create({
      context: { firstName: 'max', lastName: 'jackson' },
      template: compile("<div data-name='{{firstName}}'>Hi!</div>")
    });
    runAppend(view);

    equalInnerHTML(view.element, '<div data-name="max">Hi!</div>', "precond - attribute is output");

    run(view, view.set, 'context.firstName', null);

    equalInnerHTML(view.element, '<div data-name="">Hi!</div>', "attribute is output");
  });

  test("unquoted attributes are removed when value is null", function() {
    view = EmberView.create({
      context: { firstName: 'max' },
      template: compile("<div data-name={{firstName}}>Hi!</div>")
    });
    runAppend(view);

    equalInnerHTML(view.element, '<div data-name="max">Hi!</div>', "precond - attribute is output");

    run(view, view.set, 'context.firstName', null);

    equalInnerHTML(view.element, '<div>Hi!</div>', "attribute is output");
  });

  test("unquoted attributes that are null are not added", function() {
    view = EmberView.create({
      context: { firstName: null },
      template: compile("<div data-name={{firstName}}>Hi!</div>")
    });
    runAppend(view);

    equalInnerHTML(view.element, '<div>Hi!</div>', "attribute is not present");
  });

  test("unquoted attributes are added when changing from null", function() {
    view = EmberView.create({
      context: { firstName: null },
      template: compile("<div data-name={{firstName}}>Hi!</div>")
    });
    runAppend(view);

    equalInnerHTML(view.element, '<div>Hi!</div>', "precond - attribute is not present");

    run(view, view.set, 'context.firstName', 'max');

    equalInnerHTML(view.element, '<div data-name="max">Hi!</div>', "attribute is added output");
  });

  test("property value is directly added to attribute", function() {
    view = EmberView.create({
      context: { name: '"" data-foo="blah"' },
      template: compile("<div data-name={{name}}>Hi!</div>")
    });
    runAppend(view);

    equalInnerHTML(view.element, '<div data-name="&quot;&quot; data-foo=&quot;blah&quot;">Hi!</div>', "attribute is output");
  });

  test("path is output", function() {
    view = EmberView.create({
      context: { name: { firstName: 'erik' } },
      template: compile("<div data-name={{name.firstName}}>Hi!</div>")
    });
    runAppend(view);

    equalInnerHTML(view.element, '<div data-name="erik">Hi!</div>', "attribute is output");
  });

  test("changed property updates", function() {
    var context = EmberObject.create({ name: 'erik' });
    view = EmberView.create({
      context: context,
      template: compile("<div data-name={{name}}>Hi!</div>")
    });
    runAppend(view);

    equalInnerHTML(view.element, '<div data-name="erik">Hi!</div>', "precond - attribute is output");

    run(context, context.set, 'name', 'mmun');

    equalInnerHTML(view.element, '<div data-name="mmun">Hi!</div>', "attribute is updated output");
  });

  test("updates are scheduled in the render queue", function() {
    expect(4);

    var context = EmberObject.create({ name: 'erik' });
    view = EmberView.create({
      context: context,
      template: compile("<div data-name={{name}}>Hi!</div>")
    });
    runAppend(view);

    equalInnerHTML(view.element, '<div data-name="erik">Hi!</div>', "precond - attribute is output");

    run(function() {
      run.schedule('render', function() {
        equalInnerHTML(view.element, '<div data-name="erik">Hi!</div>', "precond - attribute is not updated sync");
      });

      context.set('name', 'mmun');

      run.schedule('render', function() {
        equalInnerHTML(view.element, '<div data-name="mmun">Hi!</div>', "attribute is updated output");
      });
    });

    equalInnerHTML(view.element, '<div data-name="mmun">Hi!</div>', "attribute is updated output");
  });

  test("updates fail silently after an element is destroyed", function() {

    var context = EmberObject.create({ name: 'erik' });
    view = EmberView.create({
      context: context,
      template: compile("<div data-name={{name}}>Hi!</div>")
    });
    runAppend(view);

    equalInnerHTML(view.element, '<div data-name="erik">Hi!</div>', "precond - attribute is output");

    run(function() {
      context.set('name', 'mmun');
      runDestroy(view);
    });
  });

  QUnit.module('ember-htmlbars: {{attribute}} helper -- setAttribute', {
    setup: function() {
      originalSetAttribute = dom.setAttribute;
      dom.setAttribute = function(element, name, value) {
        setAttributeCalls.push([name, value]);

        originalSetAttribute.call(dom, element, name, value);
      };

      setAttributeCalls = [];
    },

    teardown: function() {
      dom.setAttribute = originalSetAttribute;

      runDestroy(view);
    }
  });

  test('calls setAttribute for new values', function() {
    var context = EmberObject.create({ name: 'erik' });
    view = EmberView.create({
      context: context,
      template: compile("<div data-name={{name}}>Hi!</div>")
    });
    runAppend(view);

    run(context, context.set, 'name', 'mmun');

    var expected = [
      ['data-name', 'erik'],
      ['data-name', 'mmun']
    ];

    deepEqual(setAttributeCalls, expected);
  });

  test('does not call setAttribute if the same value is set', function() {
    var context = EmberObject.create({ name: 'erik' });
    view = EmberView.create({
      context: context,
      template: compile("<div data-name={{name}}>Hi!</div>")
    });
    runAppend(view);

    run(function() {
      context.set('name', 'mmun');
      context.set('name', 'erik');
    });

    var expected = [
      ['data-name', 'erik']
    ];

    deepEqual(setAttributeCalls, expected);
  });
}
