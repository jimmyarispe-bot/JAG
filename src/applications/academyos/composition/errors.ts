export class AcademyCompositionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AcademyCompositionError";
  }
}

export class AcademyRepositoryNotBoundError extends AcademyCompositionError {
  constructor(repositoryName: string) {
    super(
      `${repositoryName} is bound to a null implementation. Register a concrete repository in the composition root.`
    );
    this.name = "AcademyRepositoryNotBoundError";
  }
}

export class AcademyContainerNotReadyError extends AcademyCompositionError {
  constructor() {
    super(
      "AcademyOS container is not ready. Call startAcademyOS() / composeAcademyOS() first."
    );
    this.name = "AcademyContainerNotReadyError";
  }
}
