#include "Door.h"
#include "Components/StaticMeshComponent.h"
#include "Kismet/GameplayStatics.h"

ADoor::ADoor()
{
	PrimaryActorTick.bCanEverTick = false;

	DoorMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("DoorMesh"));
	SetRootComponent(DoorMesh);

	SignMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("SignMesh"));
	SignMesh->SetupAttachment(DoorMesh);
	SignMesh->SetRelativeLocation(FVector(0, 0, 120));
}

void ADoor::OpenDoor()
{
	if (bOpened) return;
	bOpened = true;

	// Animate door opening
	if (DoorMesh)
	{
		DoorMesh->SetHiddenInGame(true); // Simplified - hide when opened
	}

	// Handle door type consequences
	switch (DoorType)
	{
	case EDoorType::Exit:
		GEngine->AddOnScreenDebugMessage(-1, 5.0f, FColor::Green, TEXT("ESCAPED!"));
		break;
	case EDoorType::Enemy:
		GEngine->AddOnScreenDebugMessage(-1, 3.0f, FColor::Red, TEXT("Something stirs in the darkness..."));
		// Spawn enemy after delay (handled by level blueprint or game mode)
		break;
	case EDoorType::Supply:
		GEngine->AddOnScreenDebugMessage(-1, 3.0f, FColor::Yellow, TEXT("Found batteries!"));
		break;
	case EDoorType::Empty:
		GEngine->AddOnScreenDebugMessage(-1, 2.0f, FColor::White, TEXT("Empty room."));
		break;
	}
}

void ADoor::SetDoorType(EDoorType Type)
{
	DoorType = Type;
}