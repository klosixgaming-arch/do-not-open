using UnrealBuildTool;

public class DoNotOpen : ModuleRules
{
	public DoNotOpen()
	{
		PCHUsage = PCHUsageMode.UseExplicitOrPCHByTarget;

		PublicDependencyModuleNames.AddRange(new string[] { 
			"Core", 
			"CoreUObject", 
			"Engine", 
			"InputCore",
			"EnhancedInput",
			"UMG",
			"Slate",
			"SlateCore",
			"OnlineSubsystem",
			"OnlineSubsystemUtils",
			"Netcode"
		});

		PrivateDependencyModuleNames.AddRange(new string[] { });
	}
}