import { definePlugin, defineRule } from '@oxlint/plugins';
import type { ESTree, Scope, Variable } from '@oxlint/plugins';

type Definition = Variable['defs'][number];

const ASSERTION_MODULES = new Set(['vitest', '@playwright/test']);
const EQUALITY_MATCHERS = new Set([
  'toBe',
  'toEqual',
  'toStrictEqual',
  'toMatchObject',
]);

function variableNamed(
  scope: Scope | null,
  name: string,
): Variable | undefined {
  for (let current = scope; current; current = current.upper) {
    const variable = current.set.get(name);
    if (variable) {
      return variable;
    }
  }
  return undefined;
}

function importsExpect(definition: Definition): boolean {
  const { node, parent } = definition;
  if (
    definition.type !== 'ImportBinding' ||
    node.type !== 'ImportSpecifier' ||
    parent?.type !== 'ImportDeclaration'
  ) {
    return false;
  }
  const imported =
    node.imported.type === 'Identifier'
      ? node.imported.name
      : node.imported.value;
  return ASSERTION_MODULES.has(parent.source.value) && imported === 'expect';
}

function destructuresContextExpect(definition: Definition): boolean {
  const property = definition.name.parent;
  return (
    definition.type === 'Parameter' &&
    property?.type === 'Property' &&
    property.key.type === 'Identifier' &&
    property.key.name === 'expect'
  );
}

function importsNamespace(definition: Definition): boolean {
  const { node, parent } = definition;
  return (
    definition.type === 'ImportBinding' &&
    node.type === 'ImportNamespaceSpecifier' &&
    parent?.type === 'ImportDeclaration' &&
    ASSERTION_MODULES.has(parent.source.value)
  );
}

function isMemberExpect(base: ESTree.Expression, scope: Scope): boolean {
  if (
    base.type !== 'MemberExpression' ||
    base.computed ||
    base.object.type !== 'Identifier'
  ) {
    return false;
  }
  const variable = variableNamed(scope, base.object.name);
  return (
    base.property.type === 'Identifier' &&
    base.property.name === 'expect' &&
    variable !== undefined &&
    variable.defs.some(
      (definition) =>
        definition.type === 'Parameter' || importsNamespace(definition),
    )
  );
}

function isAssertionExpect(call: ESTree.CallExpression, scope: Scope): boolean {
  const { callee } = call;
  const soft =
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'soft';
  const base = soft ? callee.object : callee;
  if (base.type !== 'Identifier') {
    return isMemberExpect(base, scope);
  }
  const variable = variableNamed(scope, base.name);
  return variable
    ? variable.defs.some(
        (definition) =>
          importsExpect(definition) || destructuresContextExpect(definition),
      )
    : base.name === 'expect';
}

function equalityAssertion(
  node: ESTree.CallExpression,
): [ESTree.CallExpression, ESTree.Node, ESTree.Node] | undefined {
  const { callee } = node;
  if (
    callee.type !== 'MemberExpression' ||
    callee.computed ||
    callee.property.type !== 'Identifier'
  ) {
    return undefined;
  }
  const subject = callee.object;
  const [actual] = subject.type === 'CallExpression' ? subject.arguments : [];
  const [expected] = node.arguments;
  if (
    subject.type !== 'CallExpression' ||
    !actual ||
    !expected ||
    !EQUALITY_MATCHERS.has(callee.property.name)
  ) {
    return undefined;
  }
  return [subject, actual, expected];
}

function sameValue(actual: ESTree.Node, expected: ESTree.Node): boolean {
  if (actual.type === 'Literal' && expected.type === 'Literal') {
    return actual.raw === expected.raw;
  }
  return (
    actual.type === 'Identifier' &&
    expected.type === 'Identifier' &&
    actual.name === expected.name
  );
}

export default definePlugin({
  meta: { name: 'local' },
  rules: {
    'no-tautological-assertion': defineRule({
      create(context) {
        return {
          CallExpression(node) {
            const assertion = equalityAssertion(node);
            if (!assertion || !sameValue(assertion[1], assertion[2])) {
              return;
            }
            if (
              isAssertionExpect(assertion[0], context.sourceCode.getScope(node))
            ) {
              context.report({
                node,
                message:
                  'This assertion compares a value with itself, so it cannot fail; compare against an independently derived expectation.',
              });
            }
          },
        };
      },
    }),
    'no-comments': defineRule({
      create(context) {
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              if (comment.type === 'Shebang') {
                continue;
              }
              context.report({
                node: comment,
                message:
                  'Write no comments or suppression directives; rename or restructure the code until it explains itself, and fix the code a rule reports.',
              });
            }
          },
        };
      },
    }),
  },
});
