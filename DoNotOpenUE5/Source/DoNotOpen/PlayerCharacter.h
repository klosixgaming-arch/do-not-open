#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "PlayerCharacter.generated.h"

UCLASS()
class DONOTOPEN_API APlayerCharacter : public ACharacter
{
	GENERATED_BODY()

public:
	APlayerCharacter();

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float Stamina = 100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float Battery = 100.0f;

	UFUNCTION(BlueprintCallable)
	void ToggleFlashlight();

	UFUNCTION(BlueprintCallable)
	void Sprint(bool bIsSprinting);

protected:
	virtual void BeginPlay() override;
	virtual void Tick(float DeltaTime) override;

private:
	UPROPERTY()
	class USpotLightComponent* Flashlight;

	bool bFlashlightOn = false;
};