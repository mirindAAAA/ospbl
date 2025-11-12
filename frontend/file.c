#include <stdio.h>
#include <stdbool.h>

int main() {
    int p, r;
    scanf("%d", &p);
    scanf("%d", &r);

    int max[p][r], alloc[p][r], total[r], avail[r], need[p][r];
    int finish[p];

    for (int i = 0; i < p; i++) {
        for (int j = 0; j < r; j++) {
            scanf("%d", &max[i][j]);
        }
    }

    for (int i = 0; i < p; i++) {
        for (int j = 0; j < r; j++) {
            scanf("%d", &alloc[i][j]);
        }
    }

    for (int j = 0; j < r; j++) {
        scanf("%d", &total[j]);
    }

    for (int j = 0; j < r; j++) {
        int sum = 0;
        for (int i = 0; i < p; i++) {
            sum += alloc[i][j];
        }
        avail[j] = total[j] - sum;
    }

    for (int i = 0; i < p; i++) {
        for (int j = 0; j < r; j++) {
            need[i][j] = max[i][j] - alloc[i][j];
        }
    }

    for (int i = 0; i < p; i++)
        finish[i] = 0;

    int safeSeq[p];
    int count = 0;

    while (count < p) {
        bool found = false;
        for (int i = 0; i < p; i++) {
            if (finish[i] == 0) {
                int j;
                for (j = 0; j < r; j++) {
                    if (need[i][j] > avail[j])
                        break;
                }

                if (j == r) {
                    for (int k = 0; k < r; k++)
                        avail[k] += alloc[i][k];

                    safeSeq[count++] = i;
                    finish[i] = 1;
                    found = true;
                }
            }
        }

        if (!found) {
            printf("Request cannot be fulfilled\n");
            return 0;
        }
    }

    printf("Request can be fulfilled\n");
    printf("Safe Sequence: ");
    for (int i = 0; i < p; i++) {
        printf("P%d", safeSeq[i]);
        if (i != p - 1)
            printf(" -> ");
    }
    printf("\n");

    return 0;
}