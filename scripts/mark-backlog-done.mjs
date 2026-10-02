const API_URL = 'https://api.github.com/graphql';

async function graphql(query, variables = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.GH_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(
      payload.errors?.map(({ message }) => message).join('\n') ||
        `GitHub GraphQL returned ${response.status}`,
    );
  }
  return payload.data;
}

async function main() {
  const projectId = process.env.GITHUB_PROJECT_ID;
  if (!projectId)
    throw new Error('Set the CODEX_PROJECT_ID repository variable.');
  const issueNumber = process.env.PULL_REQUEST_BODY?.match(
    /(?:close[sd]?|fix(?:e[sd])?|resolv(?:e[sd])?)\s+#(\d+)/i,
  )?.[1];
  if (!issueNumber) {
    console.log('No linked issue was found in the merged pull request body.');
    return;
  }

  const projectQuery = `query($projectId: ID!) {
    node(id: $projectId) {
      ... on ProjectV2 {
        id
        fields(first: 100) { nodes { ... on ProjectV2SingleSelectField { id name options { id name } } } }
        items(first: 100) {
          nodes { id content { ... on Issue { number repository { nameWithOwner } } } }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  }`;
  const data = await graphql(projectQuery, { projectId });
  const project = data.node;
  if (!project?.id)
    throw new Error(
      'The configured GitHub Project ID is not a Project V2 board.',
    );
  const field = project.fields.nodes.find(({ name }) => name === 'Status');
  const doneOption = field?.options.find(({ name }) => name === 'Done');
  if (!field || !doneOption)
    throw new Error('Add a Done option to the Project Status field.');

  let cursor = null;
  let found = null;
  let hasNextPage = true;
  while (hasNextPage && !found) {
    const query = `query($projectId: ID!, $after: String) {
      node(id: $projectId) { ... on ProjectV2 { items(first: 100, after: $after) {
        nodes { id content { ... on Issue { number repository { nameWithOwner } } } }
        pageInfo { hasNextPage endCursor }
      } } }
    }`;
    const page = (await graphql(query, { projectId, after: cursor })).node
      .items;
    found = page.nodes.find(
      (item) =>
        String(item.content?.number) === issueNumber &&
        item.content?.repository?.nameWithOwner ===
          process.env.GITHUB_REPOSITORY,
    );
    hasNextPage = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
  }
  if (!found) {
    console.log(`Issue #${issueNumber} is not in the configured project.`);
    return;
  }

  const mutation = `mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
    updateProjectV2ItemFieldValue(input: { projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: { singleSelectOptionId: $optionId } }) { projectV2Item { id } }
  }`;
  await graphql(mutation, {
    projectId,
    itemId: found.id,
    fieldId: field.id,
    optionId: doneOption.id,
  });
  console.log(`Marked issue #${issueNumber} Done.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
