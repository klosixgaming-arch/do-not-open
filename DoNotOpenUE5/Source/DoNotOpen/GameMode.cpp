#include "GameMode.h"
#include "Kismet/KismetMathLibrary.h"

ADoNotOpenGameMode::ADoNotOpenGameMode()
{
	PlayerClass = APlayerCharacter::StaticClass();
}

void ADoNotOpenGameMode::RandomizeDoors(TArray<ADoor*> Doors)
{
	if (Doors.Num() == 0) return;

	// First door is always exit
	Doors[0]->SetDoorType(EDoorType::Exit);

	// Randomize remaining doors: 90% enemy, 10% supply
	for (int32 i = 1; i < Doors.Num(); i++)
	{
		float Roll = UKismetMathLibrary::RandomFloat();
		if (Roll < 0.9f)
		{
			Doors[i]->SetDoorType(EDoorType::Enemy);
		}
		else
		{
			Doors[i]->SetDoorType(EDoorType::Supply);
		}
	}

	// Shuffle exit position among all doors
	int32 ExitIndex = UKismetMathLibrary::RandomIntegerInRange(0, Doors.Num() - 1);
	for (ADoor* Door : Doors)
	{
		if (Door->DoorType == EDoorType::Exit)
		{
			Door->SetDoorType(EDoorType::Empty);
			break;
		}
	}
	Doors[ExitIndex]->SetDoorType(EDoorType::Exit);
}

void ADoNotOpenGameMode::SpawnPatientAtDoor(ADoor* Door)
{
	if (!Door || !GetWorld()) return;

	FTransform SpawnTransform = Door->GetActorTransform();
	APatient* Patient = GetWorld()->SpawnActor<APatient>(Patient::StaticClass(), SpawnTransform);
	
	if (PlayerState)
	{
		Patient->StartChasing(Cast<APlayerCharacter>(UGameplayStatics::GetPlayerPawn(GetWorld(), 0)));
	}

	ActivePatients.Add(Patient);
}