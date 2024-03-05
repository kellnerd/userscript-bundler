import {
  buildUserscript,
  getCurrentBranch,
  GitRepo,
} from "./index.js";

const gitRepo = GitRepo.fromPackageMetadata({
  defaultBranch: await getCurrentBranch(),
  distributionPath: "test/dist",
});

await buildUserscript("test/example.user.js", { gitRepo });
