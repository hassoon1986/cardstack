import { Workflow } from '../workflow';
import { WorkflowPostable } from './workflow-postable';

interface MilestoneOptions {
  title: string;
  postables: WorkflowPostable[];
  completedDetail: string;
}
export class Milestone {
  title: string;
  postables: WorkflowPostable[] = [];
  #includedPostables = new Set<WorkflowPostable>();
  #excludedPostables = new Set<WorkflowPostable>();
  workflow: Workflow | undefined;
  setWorkflow(wf: Workflow) {
    this.workflow = wf;
    this.postables.invoke('setWorkflow', wf);
  }
  get isComplete() {
    return this.visiblePostables.isEvery('isComplete', true);
  }
  completedDetail;

  constructor(opts: MilestoneOptions) {
    this.title = opts.title;
    this.postables = opts.postables;
    this.completedDetail = opts.completedDetail;
  }

  // return visible postables that should be visible -- all completed posts up to
  // and including the first incomplete post. Computation intentionally has some side effects:
  //   * calculate whether a post should be visible once and only once
  //   * set the timestamp on the post when we determine it should be visible
  // Designed to be called from the template.
  get visiblePostables() {
    let postablesArr = [];

    for (let i = 0; i < this.postables.length; i++) {
      let post = this.postables[i];
      if (this.#excludedPostables.has(post)) {
        continue;
      }
      if (
        post.includeIf &&
        !this.#includedPostables.has(post) &&
        post.includeIf() == false
      ) {
        this.#excludedPostables.add(post);
        continue;
      } else {
        this.#includedPostables.add(post);
        if (!post.timestamp) {
          post.timestamp = new Date();
        }
        postablesArr.push(post);
      }

      if (!post.isComplete) {
        break;
      }
    }

    return postablesArr;
  }

  // return visible postables with zero side effects
  peekAtVisiblePostables() {
    let includedPostables = this.#includedPostables;
    return this.postables.filter((p) => includedPostables.has(p));
  }
}
