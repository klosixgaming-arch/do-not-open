#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Door.generated.h"

UENUM()
enum class EDoorType : uint8
{
	Exit,
	Enemy,
	Supply,
	Empty
};

UCLASS()
class DONOTOPEN_API ADoor : public AActor
{
	GENERATED_BODY()

public:
	ADoor();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	EDoorType DoorType;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	bool bOpened = false;

	UFUNCTION(BlueprintCallable)
	void OpenDoor();

	UFUNCTION(BlueprintCallable)
	void SetDoorType(EDoorType Type);

private:
	UPROPERTY()
	class UStaticMeshComponent* DoorMesh;

	UPROPERTY()
	class UStaticMeshComponent* SignMesh;
};