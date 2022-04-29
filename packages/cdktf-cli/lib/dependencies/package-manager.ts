import { Language } from "@cdktf/provider-generator";

export abstract class PackageManager {
  public static forLanguage(language: Language): PackageManager {
    switch (language) {
      case Language.GO:
        throw new Error("Go is not supported yet");
      case Language.TYPESCRIPT:
        return new NodePackageManager();
      case Language.PYTHON:
        return new PythonPackageManager();
      case Language.CSHARP:
        return new NugetPackageManager();
      case Language.JAVA:
        return new MavenPackageManager();
      default:
        throw new Error(`Unknown language: ${language}`);
    }
  }

  public abstract addPackage(): Promise<void>;
  // public abstract listPackages(): Promise<todo>; future stuff..
}

class NodePackageManager extends PackageManager {
  public addPackage(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

class PythonPackageManager extends PackageManager {
  public addPackage(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

class NugetPackageManager extends PackageManager {
  public addPackage(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

class MavenPackageManager extends PackageManager {
  public addPackage(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
