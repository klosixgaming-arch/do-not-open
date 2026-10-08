#include "PlayerCharacter.h"
#include "Components/SpotLightComponent.h"
#include "Camera/CameraComponent.h"

APlayerCharacter::APlayerCharacter()
{
	PrimaryActorTick.bCanEverTick = true;

	// Flashlight
	Flashlight = CreateDefaultSubobject<USpotLightComponent>(TEXT("Flashlight"));
	Flashlight->SetupAttachment(GetMesh());
	Flashlight->SetIntensity(0.0f); // Default OFF
	Flashlight->SetAttenuationRadius(2500.0f);
	Flashlight->SetInnerConeAngle(36.0f);
	Flashlight->SetOuterConeAngle(45.0f);
}

void APlayerCharacter::BeginPlay()
{
	Super::BeginPlay();
	bFlashlightOn = false;
}

void APlayerCharacter::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	// Battery drain when flashlight is on
	if (bFlashlightOn && Flashlight)
	{
		Battery -= 2.0f * DeltaTime; // ~30 seconds of use
		if (Battery <= 0.0f)
		{
			ToggleFlashlight();
			GEngine->AddOnScreenDebugMessage(-1, 3.0f, FColor::Yellow, TEXT("Flashlight battery died!"));
		}
	}
}

void APlayerCharacter::ToggleFlashlight()
{
	if (!Flashlight) return;

	bFlashlightOn = !bFlashlightOn;
	
	if (bFlashlightOn && Battery > 0.0f)
	{
		Flashlight->SetIntensity(3.0f);
		GEngine->AddOnScreenDebugMessage(-1, 1.0f, FColor::White, TEXT("Flashlight ON"));
	}
	else
	{
		Flashlight->SetIntensity(0.0f);
		bFlashlightOn = false;
		GEngine->AddOnScreenDebugMessage(-1, 1.0f, FColor::White, TEXT("Flashlight OFF"));
	}
}

void APlayerCharacter::Sprint(bool bIsSprinting)
{
	if (bIsSprinting && Stamina > 0.0f)
	{
		GetCharacterMovement()->MaxWalkSpeed = 600.0f; // Sprint speed
		Stamina -= 15.0f * GetWorld()->DeltaTimeSeconds;
	}
	else
	{
		GetCharacterMovement()->MaxWalkSpeed = 300.0f; // Normal walk
		if (!bIsSprinting)
		{
			Stamina += 5.0f * GetWorld()->DeltaTimeSeconds; // Regenerate
		}
	}

	Stamina = FMath::Clamp(Stamina, 0.0f, 100.0f);
}