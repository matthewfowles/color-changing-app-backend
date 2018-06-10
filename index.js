var Koa = require("koa");
var bodyParser = require("koa-bodyparser");
var Router = require("koa-router");
var fetch = require("node-fetch");

var app = new Koa();
var router = new Router();
app.use(bodyParser());

const Authorization = `Basic ${new Buffer(
  `matthewfowles:8b9fe0fe4182822a4da62d6b4d20315395754361`
).toString("base64")}`;

const createPullRequest = branch => {
  return fetch(
    "https://api.github.com/repos/matthewfowles/color-changing-app/pulls",
    {
      method: "POST",
      body: JSON.stringify({
        title: "Updated Colors",
        body: "Lucid has updated your colors from sketch!",
        head: branch,
        base: "master"
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: Authorization
      }
    }
  );
};

const getBranch = () => {
  return fetch(
    "https://api.github.com/repos/matthewfowles/color-changing-app/branches/master"
  ).then(body => body.json());
};

const createBranch = (branch, sha) => {
  return fetch(
    "https://api.github.com/repos/matthewfowles/color-changing-app/git/refs",
    {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: sha
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: Authorization
      }
    }
  )
    .then(res => res.json())
    .catch(error => `There is an error:: ${error}`);
};

const postFile = body => {
  return fetch(
    "https://api.github.com/repos/matthewfowles/color-changing-app/contents/src/colors.json",
    {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: Authorization
      }
    }
  )
    .then(res => res.json())
    .catch(error => `There is an error:: ${error}`);
};

const getFile = () => {
  return fetch(
    "https://api.github.com/repos/matthewfowles/color-changing-app/contents/src/colors.json"
  ).then(body => body.json());
};

const GetBody = (previousFile, newFile, branch) => {
  return {
    message: "Colors Updated",
    content: new Buffer(JSON.stringify(newFile)).toString("base64"),
    sha: previousFile.sha,
    branch: branch
  };
};

router.post("/", async ctx => {
  const branchName = `feature/color-change-${Math.floor(
    Math.random() * 100000
  )}`;
  const currentFile = await getFile();
  const masterBranch = await getBranch();
  const newFile = ctx.request.body;
  const body = GetBody(currentFile, newFile, branchName);
  const updateRequest = await createBranch(branchName, masterBranch.commit.sha)
    .then(() => postFile(body))
    .then(() => createPullRequest(branchName));
  ctx.body = updateRequest;
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(process.env.port || 4000);
