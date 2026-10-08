#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "Door.h"
#include "Patient.h"
#include "PlayerCharacter.h"
#include "GameMode.generated.h"

UCLASS()
class DONOTOPEN_API ADoNotOpenGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	ADoNotOpenGameMode();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	TSubclassOf<APlayerCharacter> PlayerClass;

	UFUNCTION(BlueprintCallable)
	void RandomizeDoors(TArray<ADoor*> Doors);

	UFUNCTION(BlueprintCallable)
	void SpawnPatientAtDoor(ADoor* Door);

private:
	TArray<APatient*> ActivePatients;
};