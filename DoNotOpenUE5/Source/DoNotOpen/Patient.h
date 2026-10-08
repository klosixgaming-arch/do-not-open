#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"
#include "Patient.generated.h"

UENUM()
enum class EPatientState : uint8
{
	Emerge,
	Roam,
	Chase,
	Lose
};

UCLASS()
class DONOTOPEN_API APatient : public APawn
{
	GENERATED_BODY()

public:
	APatient();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	EPatientState State = EPatientState::Emerge;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float ChaseSpeed = 30.0f; // Very slow creep

	UFUNCTION(BlueprintCallable)
	void StartChasing(AActor* Target);

protected:
	virtual void BeginPlay() override;
	virtual void Tick(float DeltaTime) override;

private:
	UPROPERTY()
	class UStaticMeshComponent* Mesh;

	UPROPERTY()
	AActor* CurrentTarget = nullptr;

	float EmergeTimer = 0.0f;
};